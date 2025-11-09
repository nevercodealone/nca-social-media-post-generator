// Simple test script to verify the API is working
async function testAPI() {
  const testData = {
    transcript: "This is a test transcript for the social media generator. It needs to be longer than 50 characters to pass validation.",
    type: "keywords"
  };

  try {
    const response = await fetch('http://localhost:4321/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    if (!response.ok) {
      console.error('API Error:', response.status, response.statusText);
      const errorData = await response.json().catch(() => ({}));
      console.error('Error details:', errorData);
      return;
    }

    const data = await response.json();
    console.log('API Response:', data);
    
    if (data.keywords && Array.isArray(data.keywords)) {
      console.log('✅ Keywords detection working');
    } else {
      console.log('❌ Keywords detection failed');
    }
    
  } catch (error) {
    console.error('Network error:', error.message);
  }
}

// Note: This test requires the dev server to be running
console.log('🧪 Testing API endpoint...');
console.log('Make sure the dev server is running at http://localhost:4321');
console.log('To run this test: node test-api.js');

if (typeof window === 'undefined') {
  // Running in Node.js
  testAPI();
}