import { test, expect } from '@playwright/test';

test('jsonplaceholder post is reachable', { tag: ['@api', '@smoke'] }, async ({ request }) => {
  const response = await request.get('/posts/1');

  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body).toMatchObject({ id: 1 });
  expect(body).toHaveProperty('title');
});

test('jsonplaceholder creates a post', { tag: ['@api', '@regression'] }, async ({ request }) => {
  const response = await request.post('/posts', {
    data: {
      title: 'foo',
      body: 'bar',
      userId: 1,
    },
  });

  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body).toMatchObject({
    title: 'foo',
    body: 'bar',
    userId: 1,
  });
});
