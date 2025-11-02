import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { awbNumber, fileData, fileType, mediaType } = await req.json();
    
    console.log('Received upload request:', { awbNumber, fileType, mediaType });

    if (!awbNumber || !fileData) {
      throw new Error('AWB number and file data are required');
    }

    const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME');
    const apiKey = Deno.env.get('CLOUDINARY_API_KEY');
    const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error('Cloudinary credentials not configured');
    }

    const timestamp = Math.round(Date.now() / 1000);
    const folder = `Flipkart/awb/${awbNumber}`;
    
    // Create signature for authenticated upload
    const signatureString = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(signatureString);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    console.log('Uploading to Cloudinary with folder:', folder);

    // ✅ FIX: Convert base64 string to blob properly
    const base64Response = await fetch(`data:${fileType};base64,${fileData}`);
    const blob = await base64Response.blob();

    // Upload to Cloudinary
    const formData = new FormData();
    const fileExtension = fileType.split('/')[1] || (mediaType === 'video' ? 'webm' : 'png');
    formData.append('file', blob, `${mediaType}.${fileExtension}`);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append('folder', folder);

    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${mediaType}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Cloudinary upload failed:', errorText);
      throw new Error(`Cloudinary upload failed: ${errorText}`);
    }

    const result = await uploadResponse.json();
    console.log('Upload successful:', result.secure_url);

    return new Response(
      JSON.stringify({ 
        success: true, 
        url: result.secure_url,
        publicId: result.public_id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in upload-to-cloudinary function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});