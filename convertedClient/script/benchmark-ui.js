// Benchmark Dashboard UI
// This script injects a floating control panel into the page by loading an external HTML file

(function() {
  // Wait for the DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
  } else {
    initDashboard();
  }

  async function initDashboard() {
    // Avoid creating it twice
    if (document.getElementById('benchmark-dashboard')) return;

    try {
      // Fetch the HTML content
      let html;
      
      const response = await fetch('./benchmark-ui.html'); 
      if (!response.ok) throw new Error(`Status ${response.status}`);
      html = await response.text();
      

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const dashboardElement = doc.getElementById('benchmark-dashboard');

      if (dashboardElement) {
          const importedNode = document.importNode(dashboardElement, true);
          document.body.appendChild(importedNode);
      } else {
          console.error("Could not find #benchmark-dashboard in the fetched HTML.");
      }

      // Attach Event Listeners
      attachListener('btn-1-post', () => window.runBenchmark(1));
      attachListener('btn-10-posts', () => window.runBenchmark(10));
      attachListener('btn-100-posts', () => window.runBenchmark(100));
      attachListener('btn-1000-posts', () => window.runBenchmark(1000));
      attachListener('btn-clear-db', () => window.clearDatabase());

    } catch (e) {
      console.error('Error loading Benchmark Dashboard:', e);
    }
  }

  function attachListener(id, action) {
    const btn = document.getElementById(id);
    if (!btn) return;

    btn.addEventListener('click', async () => {
      
      if (typeof window.runBenchmark === 'undefined' && id.includes('post')) {
          console.error("Benchmark UI: runBenchmark not loaded.");
          alert("Error: runBenchmark script not loaded.");
          return;
      }

      const originalText = btn.innerText;
      btn.innerText = 'Running...';
      btn.disabled = true;
      try {
        await action();
      } catch (e) {
        console.error(e);
        alert('Error: ' + e.message);
      }
      btn.innerText = originalText;
      btn.disabled = false;
    });
  }
})();
