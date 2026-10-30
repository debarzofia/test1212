# NET Menu (Next.js)

Trilingual (Kurdish Sorani / Arabic / English) digital menu for NET Caffe & Restaurant.

## Run

    npm install
    npm run dev        # http://localhost:3000
    npm run build && npm start

## Edit

- Dishes, prices, categories: `data/menu.js`
- UI text and translations: `data/text.js`
- Styles: `app/globals.css`
- Photos and logo: `public/images/` (see README.txt in that folder)
- Main component: `components/MenuApp.jsx`

The order basket is saved in the browser (localStorage) and is only a list to show the waiter.
