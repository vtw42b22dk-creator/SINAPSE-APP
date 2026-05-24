import fs from 'fs'

var site = process.env.SITE_URL || 'https://vtw42b22dk-creator.github.io/SINAPSE-APP/'
if (!site.endsWith('/')) site += '/'

var manifestPath = 'dist/manifest.webmanifest'
var m = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
m.start_url = site
m.scope = site
m.id = site
m.display = 'standalone'
m.icons = [
  {
    src: site + 'favicon.svg',
    sizes: 'any',
    type: 'image/svg+xml',
    purpose: 'any maskable',
  },
]
fs.writeFileSync(manifestPath, JSON.stringify(m, null, 2) + '\n')

var htmlPath = 'dist/index.html'
var html = fs.readFileSync(htmlPath, 'utf8')
var canonical = '<link rel="canonical" href="' + site + '" />'
if (html.indexOf('rel="canonical"') < 0) {
  html = html.replace('<head>', '<head>\n    ' + canonical)
}
var appleStart = '<meta name="apple-mobile-web-app-starturl" content="' + site + '" />'
if (html.indexOf('apple-mobile-web-app-starturl') < 0) {
  html = html.replace(
    '<meta name="apple-mobile-web-app-title"',
    appleStart + '\n    <meta name="apple-mobile-web-app-title"'
  )
}
fs.writeFileSync(htmlPath, html)
fs.writeFileSync('dist/404.html', html)

console.log('PWA patched for', site)
