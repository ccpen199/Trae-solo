export function success(data = null) {
  return { code: 0, data, message: 'ok' };
}

export function error(message = '操作失败', code = -1) {
  return { code, data: null, message };
}

export function paginate(list, total, page, pageSize) {
  return {
    code: 0,
    data: {
      list,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
      totalPages: Math.ceil(total / pageSize) || 1,
    },
    message: 'ok',
  };
}
