/**
 * Network Connectivity Utilities
 * Helps diagnose network and Cloudinary connectivity issues
 */

/**
 * Test basic internet connectivity by pinging a fast, reliable endpoint
 */
export const testInternetConnection = async (): Promise<{
  connected: boolean;
  responseTime: number;
  error?: string;
}> => {
  const startTime = Date.now();
  try {
    console.log('🌐 Testing internet connectivity...');
    
    // Use Google's DNS API as a lightweight connectivity check
    const response = await fetch('https://www.google.com/generate_204', {
      method: 'HEAD',
      mode: 'no-cors',
    });

    const responseTime = Date.now() - startTime;
    console.log(`✅ Internet connected (${responseTime}ms)`);

    return { connected: true, responseTime };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ Internet connection failed (${responseTime}ms):`, error?.message);
    return {
      connected: false,
      responseTime,
      error: error?.message,
    };
  }
};

/**
 * Test Cloudinary endpoint accessibility
 */
export const testCloudinaryEndpoint = async (): Promise<{
  reachable: boolean;
  responseTime: number;
  presetValid?: boolean;
  error?: string;
}> => {
  const startTime = Date.now();
  try {
    console.log('☁️  Testing Cloudinary endpoint...');

    const formData = new FormData();
    formData.append('upload_preset', 'STARVISTA');

    const response = await fetch('https://api.cloudinary.com/v1_1/doe8ybkzu/image/upload', {
      method: 'POST',
      body: formData,
    });

    const responseTime = Date.now() - startTime;

    if (response.status === 400) {
      // 400 is expected when no file - but means endpoint is reachable
      try {
        const errorData = await response.json();
        if (errorData?.error?.message?.includes('Invalid upload preset')) {
          console.warn('⚠️  Cloudinary preset might not be valid');
          return {
            reachable: true,
            responseTime,
            presetValid: false,
            error: 'Upload preset "STARVISTA" not found or not configured for unsigned uploads',
          };
        }
      } catch {}
      console.log(`✅ Cloudinary endpoint reachable (${responseTime}ms)`);
      return { reachable: true, responseTime, presetValid: true };
    }

    console.log(`⚠️  Cloudinary returned status ${response.status} (${responseTime}ms)`);
    return { reachable: true, responseTime };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ Cannot reach Cloudinary (${responseTime}ms):`, error?.message);
    return {
      reachable: false,
      responseTime,
      error: error?.message,
    };
  }
};

/**
 * Run complete network diagnostics
 */
export const runNetworkDiagnostics = async (): Promise<{
  internet: any;
  cloudinary: any;
  summary: string;
}> => {
  console.log('\n🔍 RUNNING NETWORK DIAGNOSTICS');
  console.log('================================');

  const internet = await testInternetConnection();
  console.log('\n---\n');
  const cloudinary = await testCloudinaryEndpoint();

  let summary = '';
  if (!internet.connected) {
    summary = '❌ No internet connection. Check WiFi or mobile data.';
  } else if (!cloudinary.reachable) {
    summary = '❌ Cannot reach Cloudinary. Check firewall or VPN settings.';
  } else if (cloudinary.presetValid === false) {
    summary = '❌ Cloudinary preset is invalid. Check Cloudinary dashboard settings.';
  } else {
    summary = '✅ All systems operational! Network connectivity is good.';
  }

  console.log('\n' + summary);
  console.log('================================\n');

  return { internet, cloudinary, summary };
};

/**
 * Check if a file URI is accessible
 */
export const testImageURI = async (uri: string): Promise<{
  accessible: boolean;
  size?: number;
  error?: string;
}> => {
  try {
    console.log(`📸 Testing image URI accessibility: ${uri.substring(0, 50)}...`);

    // Try to fetch the file
    const response = await fetch(uri);

    if (!response.ok) {
      return {
        accessible: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const blob = await response.blob();
    console.log(`✅ Image is accessible (${(blob.size / 1024).toFixed(2)} KB)`);

    return {
      accessible: true,
      size: blob.size,
    };
  } catch (error: any) {
    console.error(`❌ Cannot access image URI:`, error?.message);
    return {
      accessible: false,
      error: error?.message,
    };
  }
};
