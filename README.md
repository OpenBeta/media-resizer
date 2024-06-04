# media-server

This project has been replaced by the following CloudFlare worker:

```
addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

const getBaseURL = (hostname, pathname, referer) => {
  const isStaging = hostname === "stg-media.openbeta.io"
  const isStatic = pathname.startsWith("/_next/static")
  // handling static frontend content
  if (isStatic) {
    // we use the referer to keep vercel previews working
    if (referer){
      return referer.replace(/\/$/, "");
    }
    // otherwise we route to the standard staging/prod base url
    if (isStaging){
      return "https://stg.openbeta.io";
    }
    return "https://openbeta.io";
  }
  // handling other photos stored in google
  if (isStaging) {
    return "https://storage.googleapis.com/openbeta-staging";
  }
  return "https://storage.googleapis.com/openbeta-prod";
};

/**
 * Fetch and log a request
 * @param {Request} request
 */
async function handleRequest(request) {
  // Parse request URL to get access to query string
  const url = new URL(request.url);

  if (url.pathname.length < 2)
    return new Response("Missing image", { status: 400 });
  if (!/\.(jpe?g|png|gif|webp)$/i.test(url.pathname)) {
    return new Response("Disallowed file extension", { status: 400 });
  }

  // Cloudflare-specific options are in the cf object.
  let options = { cf: { image: {} } };

  // Copy parameters from query string to request options.
  // You can implement various different parameters here.
  if (url.searchParams.has("w"))
    options.cf.image.width = url.searchParams.get("w");
  if (url.searchParams.has("q"))
    options.cf.image.quality = url.searchParams.get("q");
  if (url.searchParams.has("h"))
    options.cf.image.height = url.searchParams.get("h");

  // Your Worker is responsible for automatic format negotiation. Check the Accept header.
  const accept = request.headers.get("Accept");
  if (/image\/avif/.test(accept)) {
    options.cf.image.format = "avif";
  } else if (/image\/webp/.test(accept)) {
    options.cf.image.format = "webp";
  }

  const baseURL = getBaseURL(
    url.hostname,
    url.pathname,
    request.headers.get("referer"),
  );
  const imageURL = `${baseURL}${url.pathname}`;

  // Build a request that passes through request headers
  const imageRequest = new Request(imageURL, {
    headers: request.headers,
  });

  let response = await fetch(imageRequest, options);
  response = new Response(response.body, response);
  response.headers.set("Cache-Control", "public, max-age=15552000");
  return response;
}

```
