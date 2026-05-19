// vary // https://www.npmjs.com/package/vary

let FIELD_NAME_REGEXP = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;

function append (header, field) {
  if (typeof header !== 'string') { throw new TypeError('header argument is required'); }

  if (!field) { throw new TypeError('field argument is required'); }

  let fields = !Array.isArray(field) ? parse(String(field)) : field;

  for (let j = 0; j < fields.length; j++) {
    if (!FIELD_NAME_REGEXP.test(fields[j])) {
      throw new TypeError('field argument contains an invalid header name');
    }
  }

  if (header === '*') { return header; }

  let val = header;
  let vals = parse(header.toLowerCase());

  if (fields.indexOf('*') !== -1 || vals.indexOf('*') !== -1) { return '*'; }

  for (let i = 0; i < fields.length; i++) {
    let fld = fields[i].toLowerCase();
    if (vals.indexOf(fld) === -1) {
      vals.push(fld);
      val = val ? val + ', ' + fields[i] : fields[i];
    }
  }

  return val;
}

function parse (header) {
  let end = 0;
  let list = [];
  let start = 0;

  for (let i = 0, len = header.length; i < len; i++) {
    switch (header.charCodeAt(i)) {
      case 0x20: // ' '
        if (start === end) { start = end = i + 1; }
        break;
      case 0x2c: // ','
        list.push(header.substring(start, end));
        start = end = i + 1;
        break;
      default:
        end = i + 1;
        break;
    }
  }

  list.push(header.substring(start, end));

  return list;
}

function vary (res, field) {
  if (!res || !res.getHeader || !res.setHeader) { throw new TypeError('res argument is required'); }

  let val = res.getHeader('Vary') || '';
  let header = Array.isArray(val) ? val.join(', ') : String(val);

  if ((val = append(header, field))) { res.setHeader('Vary', val); }
}

export { append };
export default vary;
