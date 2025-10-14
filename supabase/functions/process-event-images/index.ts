import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ImageProcessingResult {
  success: boolean;
  imageId?: string;
  urls?: {
    small: string;
    medium: string;
    large: string;
  };
  error?: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, is_enabled')
      .eq('id', user.id)
      .single();

    if (userError || !userData || !userData.is_enabled) {
      return new Response(
        JSON.stringify({ error: 'User not found or disabled' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!['Super Admin', 'Admin', 'Content Manager'].includes(userData.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const eventId = formData.get('eventId') as string;
    const eventSlug = formData.get('eventSlug') as string;
    const altText = formData.get('altText') as string || '';
    const sequenceStr = formData.get('sequence') as string;
    const sequence = sequenceStr ? parseInt(sequenceStr, 10) : 0;

    if (!file || !eventId || !eventSlug) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: file, eventId, eventSlug' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'File size exceeds 10MB limit' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const imageId = crypto.randomUUID();
    const timestamp = Date.now();
    const filename = `${eventSlug}-${timestamp}-${sequence}`;

    const imageBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(imageBuffer);

    const smallPath = `events/${eventId}/images/small/${filename}.jpg`;
    const mediumPath = `events/${eventId}/images/medium/${filename}.jpg`;
    const largePath = `events/${eventId}/images/large/${filename}.jpg`;

    const { error: uploadErrorSmall } = await supabase.storage
      .from('events')
      .upload(smallPath, uint8Array, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadErrorSmall) {
      console.error('Upload error (small):', uploadErrorSmall);
      return new Response(
        JSON.stringify({ error: `Upload failed: ${uploadErrorSmall.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { error: uploadErrorMedium } = await supabase.storage
      .from('events')
      .upload(mediumPath, uint8Array, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadErrorMedium) {
      console.error('Upload error (medium):', uploadErrorMedium);
      await supabase.storage.from('events').remove([smallPath]);
      return new Response(
        JSON.stringify({ error: `Upload failed: ${uploadErrorMedium.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { error: uploadErrorLarge } = await supabase.storage
      .from('events')
      .upload(largePath, uint8Array, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadErrorLarge) {
      console.error('Upload error (large):', uploadErrorLarge);
      await supabase.storage.from('events').remove([smallPath, mediumPath]);
      return new Response(
        JSON.stringify({ error: `Upload failed: ${uploadErrorLarge.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: { publicUrl: smallUrl } } = supabase.storage
      .from('events')
      .getPublicUrl(smallPath);

    const { data: { publicUrl: mediumUrl } } = supabase.storage
      .from('events')
      .getPublicUrl(mediumPath);

    const { data: { publicUrl: largeUrl } } = supabase.storage
      .from('events')
      .getPublicUrl(largePath);

    const { data: displayOrderData } = await supabase.rpc('get_next_image_order', {
      p_event_id: eventId,
    });
    const displayOrder = displayOrderData || 0;

    const { data: imageData, error: dbError } = await supabase
      .from('event_images')
      .insert({
        id: imageId,
        event_id: eventId,
        image_url_small: smallUrl,
        image_url_medium: mediumUrl,
        image_url_large: largeUrl,
        alt_text: altText,
        display_order: displayOrder,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      await supabase.storage.from('events').remove([smallPath, mediumPath, largePath]);
      return new Response(
        JSON.stringify({ error: `Database error: ${dbError.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const result: ImageProcessingResult = {
      success: true,
      imageId: imageData.id,
      urls: {
        small: smallUrl,
        medium: mediumUrl,
        large: largeUrl,
      },
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
