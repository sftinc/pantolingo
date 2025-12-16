/**
 * KV Key Listing Utility
 *
 * Run with: npx wrangler dev src/dev/kv.js --kv KV
 * Then visit http://localhost:8787
 */

export default {
  async fetch(_request, env) {
    try {
      // List all keys
      const allKeys = [];
      let cursor = undefined;
      let hasMore = true;

      while (hasMore) {
        const listResult = await env.KV.list({
          cursor: cursor,
          limit: 1000
        });

        allKeys.push(...listResult.keys);
        hasMore = !listResult.list_complete;
        cursor = listResult.cursor;
      }

      let output = `KV CACHE CONTENTS\nTotal keys: ${allKeys.length}\n\n`;

      // Fetch and display each key's value
      for (const keyInfo of allKeys) {
        const key = keyInfo.name;
        const value = await env.KV.get(key, { type: 'text' });

        output += `${'='.repeat(80)}\n`;
        output += `KEY: ${key}\n`;
        output += `${'='.repeat(80)}\n`;

        if (value) {
          try {
            const parsed = JSON.parse(value);
            output += JSON.stringify(parsed, null, 2);
          } catch (e) {
            output += value;
          }
        } else {
          output += '(empty)';
        }

        output += '\n\n';
      }

      output += `${'='.repeat(80)}\n`;
      output += `Done. Listed ${allKeys.length} keys.\n`;

      const html = `<!DOCTYPE html>
<html>
<head>
  <title>KV Cache Contents</title>
  <style>
    body { margin: 0; padding: 20px; font-family: monospace; }
    pre { margin: 0; white-space: pre-wrap; }
  </style>
</head>
<body>
  <pre>${escapeHtml(output)}</pre>
</body>
</html>`;

      return new Response(html, {
        headers: { 'Content-Type': 'text/html' }
      });

    } catch (error) {
      return new Response(`Error: ${error.message}`, {
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  }
};

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
