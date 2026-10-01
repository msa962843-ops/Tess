export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  // 1. Ambil slug dari query parameter (?v=)
  let slug = url.searchParams.get('v') || url.searchParams.get('p') || url.searchParams.get('slug');

  if (!slug) {
    const pathSegments = url.pathname.split('/').filter(p => p.length > 0);
    const lastSeg = pathSegments[pathSegments.length - 1];
    if (lastSeg && !['index.html', '404.html', 'upload.html', 'view.html'].includes(lastSeg)) {
      slug = lastSeg;
    }
  }

  if (!slug) {
    return context.next();
  }

  try {
    const supabaseUrl = "https://ehhrvswzhirrnrqxmxae.supabase.co";
    const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoaHJ2c3d6aGlycm5ycXhteGFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMjg2NDcsImV4cCI6MjA5NTgwNDY0N30.75vZs3Rn6j7YSlInHpGDN39OGjhywcEBv8j-hawyOlY";

    // Request data dari Supabase
    const apiReq = await fetch(`${supabaseUrl}/rest/v1/video_packages?slug=eq.${slug}&select=title,video_items(count)`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });

    if (apiReq.ok) {
      const data = await apiReq.json();

      if (data && data.length > 0) {
        const folderTitle = data[0].title || 'root';
        const fileCount = data[0].video_items && data[0].video_items[0] ? data[0].video_items[0].count : 0;

        const pageTitle = `${folderTitle} · Gofile`;
        const pageDesc = `${fileCount} files shared with Gofile`;

        const response = await context.next();

        // Menyisipkan/mengubah meta tag secara pasti di <head>
        return new HTMLRewriter()
          .on('title', {
            element(e) {
              e.setInnerContent(pageTitle);
            }
          })
          .on('head', {
            element(e) {
              // Menyisipkan tag OG secara langsung ke dalam <head>
              e.append(`
                <meta property="og:title" content="${pageTitle}" />
                <meta property="og:description" content="${pageDesc}" />
                <meta name="twitter:title" content="${pageTitle}" />
                <meta name="twitter:description" content="${pageDesc}" />
              `, { html: true });
            }
          })
          .transform(response);
      }
    }
  } catch (err) {
    return context.next();
  }

  return context.next();
}
