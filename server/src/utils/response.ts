export function success(data: any = null, message = 'success') {
  return {
    code: 0,
    message,
    data,
  };
}

export function error(message: string, code = -1, data: any = null) {
  return {
    code,
    message,
    data,
  };
}

export function paginate(list: any[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return {
    list: list.slice(start, end),
    total: list.length,
    page,
    pageSize,
  };
}
