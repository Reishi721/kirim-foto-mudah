import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeletePhotoRequest {
  action: 'delete_photo';
  filePath: string;
  recordId: string;
}

interface DeleteUserRequest {
  action: 'delete_user';
  userId: string;
}

interface GetUsersRequest {
  action: 'get_users';
}

type AdminRequest = DeletePhotoRequest | DeleteUserRequest | GetUsersRequest;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Create Supabase client with the user's JWT token
    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Verify user is authenticated by getting user from the JWT
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Authentication error:', userError);
      throw new Error('Unauthorized');
    }

    console.log('User authenticated:', user.id);

    // Check if user is admin using our security definer function
    const { data: isAdminData, error: adminError } = await supabaseClient
      .rpc('is_admin');

    if (adminError) {
      console.error('Admin check error:', adminError);
      throw new Error('Failed to verify admin status');
    }

    if (!isAdminData) {
      console.log('User is not admin:', user.id);
      throw new Error('Forbidden: Admin access required');
    }

    console.log('Admin verified, processing request');

    const requestBody: AdminRequest = await req.json();
    
    // Create service role client for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    switch (requestBody.action) {
      case 'get_users': {
        console.log('Fetching all users');
        
        // Get all users from auth
        const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (usersError) {
          console.error('Error fetching users:', usersError);
          throw usersError;
        }

        // Get upload counts for each user
        const { data: uploadCounts, error: countsError } = await supabaseAdmin
          .from('upload_records')
          .select('user_id, id');
        
        if (countsError) {
          console.error('Error fetching upload counts:', countsError);
        }

        // Get roles for each user
        const { data: userRoles, error: rolesError } = await supabaseAdmin
          .from('user_roles')
          .select('user_id, role');
        
        if (rolesError) {
          console.error('Error fetching roles:', rolesError);
        }

        const usersWithDetails = users.map(user => {
          const uploadCount = uploadCounts?.filter(u => u.user_id === user.id).length || 0;
          const roles = userRoles?.filter(r => r.user_id === user.id).map(r => r.role) || [];
          
          return {
            id: user.id,
            email: user.email,
            created_at: user.created_at,
            last_sign_in_at: user.last_sign_in_at,
            upload_count: uploadCount,
            roles: roles,
          };
        });

        console.log(`Returning ${usersWithDetails.length} users`);

        return new Response(
          JSON.stringify({ users: usersWithDetails }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete_photo': {
        const { filePath, recordId } = requestBody;
        console.log('Deleting photo:', filePath, 'from record:', recordId);

        // Delete from storage
        const { error: storageError } = await supabaseAdmin.storage
          .from('surat-jalan-uploads')
          .remove([filePath]);

        if (storageError) {
          console.error('Storage deletion error:', storageError);
          throw storageError;
        }

        // Update file count in record or delete record if no files left
        const { data: record, error: recordError } = await supabaseAdmin
          .from('upload_records')
          .select('file_count, folder_path')
          .eq('id', recordId)
          .single();

        if (recordError) {
          console.error('Error fetching record:', recordError);
          throw recordError;
        }

        const newFileCount = (record.file_count || 1) - 1;

        if (newFileCount <= 0) {
          // Delete the record if no files left
          const { error: deleteError } = await supabaseAdmin
            .from('upload_records')
            .delete()
            .eq('id', recordId);

          if (deleteError) {
            console.error('Error deleting record:', deleteError);
            throw deleteError;
          }
          console.log('Record deleted (no files remaining)');
        } else {
          // Update file count
          const { error: updateError } = await supabaseAdmin
            .from('upload_records')
            .update({ file_count: newFileCount })
            .eq('id', recordId);

          if (updateError) {
            console.error('Error updating record:', updateError);
            throw updateError;
          }
          console.log('Record updated, new file count:', newFileCount);
        }

        return new Response(
          JSON.stringify({ success: true, deleted_record: newFileCount <= 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete_user': {
        const { userId } = requestBody;
        console.log('Deleting user:', userId);

        // Get user's upload records to delete their files
        const { data: records, error: recordsError } = await supabaseAdmin
          .from('upload_records')
          .select('folder_path')
          .eq('user_id', userId);

        if (recordsError) {
          console.error('Error fetching user records:', recordsError);
        }

        // Delete user's files from storage
        if (records && records.length > 0) {
          for (const record of records) {
            const { error: storageError } = await supabaseAdmin.storage
              .from('surat-jalan-uploads')
              .remove([record.folder_path]);

            if (storageError) {
              console.error('Error deleting folder:', record.folder_path, storageError);
            }
          }
        }

        // Delete user from auth (this will cascade delete records and roles due to FK constraints)
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (deleteError) {
          console.error('Error deleting user:', deleteError);
          throw deleteError;
        }

        console.log('User deleted successfully');

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: errorMessage.includes('Unauthorized') ? 401 : 
                errorMessage.includes('Forbidden') ? 403 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
