export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  // Ambil kode slug/ID dari query parameter ?p= / ?v= atau dari URL path
  let slug = url.searchParams.get('p') || url.searchParams.get('v');
  if (!slug) {
    const pathParts = url.pathname.split('/').filter(p => p.length > 0);
    slug = pathParts[pathParts.length - 1];
  }

  // Ambil halaman asli dari Cloudflare Pages
  const response = await context.next();

  // Jika diakses tanpa slug folder (misal halaman utama), kembalikan respon biasa
  if (!slug || slug === 'view.html' || slug === 'index.html' || slug === 'upload.html') {
    return response;
  }

  try {
    const supabaseUrl = "https://ehhrvswzhirrnrqxmxae.supabase.co";
    const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoaHJ2c3d6aGlycm5ycXhteGFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMjg2NDcsImV4cCI6MjA5NTgwNDY0N30.75vZs3Rn6j7YSlInHpGDN39OGjhywcEBv8j-hawyOlY";

    // Minta data judul folder & jumlah video dari Supabase REST API
    const apiReq = await fetch(`${supabaseUrl}/rest/v1/video_packages?slug=eq.${slug}&select=title,video_items(count)`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });

    const data = await apiReq.json();

    if (data && data.length > 0) {
      const folderTitle = data[0].title || 'Root';
      const fileCount = data[0].video_items ? data[0].video_items[0].count : 0;

      const ogTitle = `${folderTitle} · Gofile`;
      const ogDesc = `${fileCount} files shared with Gofile`;

      // Transformasi HTML untuk menyuntikkan meta tag saat di-crawl WhatsApp/Telegram/X
      return new HTMLRewriter()
        .on('title', { element(e) { e.setInnerContent(ogTitle); } })
        .on('head', {
          element(e) {
            e.append(`<meta property="og:title" content="${ogTitle}" />`, { html: true });
            e.append(`<meta property="og:description" content="${ogDesc}" />`, { html: true });
            e.append(`<meta property="og:site_name" content="Gofile" />`, { html: true });
            e.append(`<meta property="og:type" content="website" />`, { html: true });
            e.append(`<meta name="twitter:card" content="summary" />`, { html: true });
            e.append(`<meta name="twitter:title" content="${ogTitle}" />`, { html: true });
            e.append(`<meta name="twitter:description" content="${ogDesc}" />`, { html: true });
          }
        })
        .transform(response);
    }
  } catch (err) {
    return response;
  }

  return response;
}
