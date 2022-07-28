module.exports = [
  {
    method: 'GET',
    path: '/config',
    handler: 'config.get',
  },
  {
    method: 'PUT',
    path: '/config',
    handler: 'config.put',
  },
  // {
  //   method: 'DELETE',
  //   path: '/config',
  //   handler: 'admin.restoreConfig',
  // },
];