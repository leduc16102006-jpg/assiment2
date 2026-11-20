import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ProductCard from './ProductCard';

test('ProductCard displays the correct product name and price', () => {
  const html = renderToStaticMarkup(
    createElement(ProductCard, {
      name: 'Bạc xỉu',
      price: 35000,
      imageUrl: null,
      onClick: () => {},
    })
  );

  assert.match(html, /Bạc xỉu/);
  assert.match(html, /35\.000 đ/);
});

test('ProductCard displays the fallback when there is no image', () => {
  const html = renderToStaticMarkup(
    createElement(ProductCard, {
      name: 'Bạc xỉu',
      price: 35000,
      imageUrl: null,
      onClick: () => {},
    })
  );

  assert.match(html, /Chưa có hình ảnh/);
});

test('ProductCard renders the product image when imageUrl is provided', () => {
  const html = renderToStaticMarkup(
    createElement(ProductCard, {
      name: 'Bạc xỉu',
      price: 35000,
      imageUrl: '/images/bac-xiu.jpg',
      onClick: () => {},
    })
  );

  assert.match(html, /alt="Bạc xỉu"/);
});
