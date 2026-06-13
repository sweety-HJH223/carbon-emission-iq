/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://*.firebaseapp.com https://*.googleapis.com https://*.gstatic.com",
              "script-src-elem 'self' 'unsafe-inline' https://apis.google.com https://*.firebaseapp.com https://*.googleapis.com https://*.gstatic.com",
              "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com https://*.google.com",
              "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.google.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com",
              "img-src 'self' data: https://*.googleusercontent.com https://*.google.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com",
              "font-src 'self' https://fonts.gstatic.com",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default nextConfig