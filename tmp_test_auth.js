const http = require('http');

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, body: data, cookies: res.headers['set-cookie'] || [] });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  try {
    // Step 1: Get CSRF token
    const csrfRes = await request({ hostname: '127.0.0.1', port: 3000, path: '/api/auth/csrf', method: 'GET' });
    const csrfData = JSON.parse(csrfRes.body);
    const csrfToken = csrfData.csrfToken;
    let cookies = csrfRes.cookies.map(c => c.split(';')[0]).join('; ');
    console.log('CSRF:', csrfToken ? 'OK' : 'MISSING');

    // Step 2: Login with credentials
    const postData = `csrfToken=${csrfToken}&email=admin@gmail.com&password=12345678&redirect=false&callbackUrl=http%3A%2F%2F127.0.0.1%3A3000%2Fdashboard`;
    const loginRes = await request({
      hostname: '127.0.0.1', port: 3000, path: '/api/auth/callback/credentials',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(postData), 'Cookie': cookies }
    }, postData);
    cookies = [...loginRes.cookies.map(c => c.split(';')[0])].join('; ');
    console.log('Login status:', loginRes.status);

    // Step 3: Access demandes list page
    const listRes = await request({ hostname: '127.0.0.1', port: 3000, path: '/dashboard/admin/demandes', method: 'GET', headers: { Cookie: cookies } });
    console.log('List page status:', listRes.status);
    if (listRes.status === 307 || listRes.status === 302) {
      console.log('Redirect to:', listRes.headers.location);
      // Follow redirect
      const redirected = await request({ hostname: '127.0.0.1', port: 3000, path: listRes.headers.location, method: 'GET', headers: { Cookie: cookies } });
      console.log('After redirect status:', redirected.status);
    }

    // Find a demande ID from the list page HTML
    const match = listRes.body.match(/\/dashboard\/admin\/demandes\/(\d+)/);
    if (match) {
      const id = match[1];
      console.log('Found demande ID:', id);

      // Step 4: Access demande detail page
      const detailRes = await request({ hostname: '127.0.0.1', port: 3000, path: `/dashboard/admin/demandes/${id}`, method: 'GET', headers: { Cookie: cookies } });
      console.log('Detail page status:', detailRes.status);
      if (detailRes.status === 200) {
        // Check for key elements
        const html = detailRes.body;
        console.log('Has "Supprimer la demande":', html.includes('Supprimer la demande'));
        console.log('Has "Modifier le statut":', html.includes('Modifier le statut'));
        console.log('Has "Supprimer":', html.includes('Supprimer'));
        console.log('Has TRAITEE:', html.includes('TRAITEE') || html.includes('Trait'));
        console.log('Has DeleteDemandeDialog:', html.includes('DeleteDemandeDialog') || html.includes('supprim'));
        // Check for the button
        const hasDeleteButton = html.includes('Supprimer la demande') || html.includes('bg-destructive');
        console.log('Has delete button in HTML:', hasDeleteButton);
      }
    } else {
      console.log('No demande found on list page');
    }

  } catch(e) {
    console.log('Error:', e.message);
  }
}
main();
