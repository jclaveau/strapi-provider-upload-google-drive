module.exports = [
  {
    method: 'GET',
    path: '/settings',
    handler: 'settings.get',
  },
  {
    method: 'PUT',
    path: '/settings',
    handler: 'settings.put',
  },
];