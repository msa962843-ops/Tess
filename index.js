export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. Ambil slug dari query string (?v= / ?p= / ?slug=)
    let slug = url.searchParams.get('v') || url.searchParams.get('p') || url.searchParams.get('slug');

    // 2. Ekstraksi slug jika formatnya pathname
    if (!slug) {
      const pathSegments = url.pathname.split('/').filter(p => p.length > 0);
      const lastSeg = pathSegments[pathSegments.length - 1];
      if (lastSeg && !['index.html', '404.html', 'upload.html', 'view.html'].includes(lastSeg)) {
        slug = lastSeg;
      }
    }

    // Ambil asset statis asli (index.html)
    const response = await env.ASSETS.fetch(request);

    // Jika tidak ada slug, kembalikan halaman biasa
    if (!slug) {
      return response;
    }

    try {
      const supabaseUrl = "https://ehhrvswzhirrnrqxmxae.supabase.co";
      const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoaHJ2c3d6aGlycm5ycXhteGFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMjg2NDcsImV4cCI6MjA5NTgwNDY0N30.75vZs3Rn6j7YSlInHpGDN39OGjhywcEBv8j-hawyOlY";

      // Request data ke Supabase REST API
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

          // Ganti / Sisipkan meta tag dengan HTMLRewriter
          return new HTMLRewriter()
            .on('title', { element(e) { e.setInnerContent(pageTitle); } })
            .on('meta[property="og:title"]', { element(e) { e.setAttribute('content', pageTitle); } })
            .on('meta[property="og:description"]', { element(e) { e.setAttribute('content', pageDesc); } })
            .on('meta[name="twitter:title"]', { element(e) { e.setAttribute('content', pageTitle); } })
            .on('meta[name="twitter:description"]', { element(e) { e.setAttribute('content', pageDesc); } })
            .transform(response);
        }
      }
    } catch (err) {
      return response;
    }

    return response;
  }
};
