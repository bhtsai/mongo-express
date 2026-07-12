/* eslint-disable curly, max-len, no-underscore-dangle, no-param-reassign, no-plusplus, no-restricted-syntax, no-use-before-define, object-property-newline, prefer-rest-params, unicorn/explicit-length-check, unicorn/no-array-callback-reference, unicorn/no-array-for-each, unicorn/no-array-reduce, unicorn/no-for-loop, unicorn/no-negated-condition, unicorn/no-null, unicorn/no-useless-undefined, unicorn/prefer-add-event-listener, unicorn/prefer-dom-node-append, unicorn/prefer-spread */
// Local adaptation of renderjson-2: arrays always start collapsed so that
// large array fields do not dominate the collection view.
export default (function () {
  const themetext = function () {
    const spans = [];
    while (arguments.length) spans.push(append(span(Array.prototype.shift.call(arguments)), text(Array.prototype.shift.call(arguments))));
    return spans;
  };
  const append = function () {
    const el = Array.prototype.shift.call(arguments);
    for (let index = 0; index < arguments.length; index++) {
      if (arguments[index].constructor === Array) append.apply(this, [el].concat(arguments[index]));
      else el.appendChild(arguments[index]);
    }
    return el;
  };
  const prepend = (el, child) => {
    el.insertBefore(child, el.firstChild);
    return el;
  };
  const isempty = (object, propertyList) => {
    const keys = propertyList || Object.keys(object);
    for (const index in keys) if (Object.hasOwnProperty.call(object, keys[index])) return false;
    return true;
  };
  const text = (value) => document.createTextNode(value);
  const span = (className) => {
    const element = document.createElement('span');
    if (className) element.className = className;
    return element;
  };
  const link = (value, className, callback) => {
    const element = document.createElement('a');
    if (className) element.className = className;
    element.appendChild(text(value));
    element.href = '#';
    element.onclick = (event) => {
      callback();
      if (event) event.stopPropagation();
      return false;
    };
    return element;
  };

  function render(value, indent, dontIndent, showLevel, options) {
    const currentIndent = dontIndent ? '' : indent;
    const disclosure = (open, placeholder, close, type, builder) => {
      let content;
      const empty = span(type);
      const show = () => {
        if (!content) append(empty.parentNode, content = prepend(builder(), link(options.hide, 'disclosure', () => {
          content.style.display = 'none';
          empty.style.display = 'inline';
        })));
        content.style.display = 'inline';
        empty.style.display = 'none';
      };
      append(empty, link(options.show, 'disclosure', show), themetext(`${type} syntax`, open), link(placeholder, null, show), themetext(`${type} syntax`, close));
      const element = append(span(), text(currentIndent.slice(0, -1)), empty);
      if (showLevel > 0 && type !== 'string' && type !== 'array') show();
      return element;
    };

    if (value === null) return themetext(null, currentIndent, 'keyword', 'null');
    if (value === undefined) return themetext(null, currentIndent, 'keyword', 'undefined');
    if (typeof value === 'string' && value.length > options.maxStringLength) return disclosure('"', `${value.slice(0, options.maxStringLength)} ...`, '"', 'string', () => append(span('string'), themetext(null, currentIndent, 'string', JSON.stringify(value))));
    if (typeof value !== 'object' || [Number, String, Boolean, Date].includes(value.constructor)) return themetext(null, currentIndent, typeof value, JSON.stringify(value));
    if (value.constructor === Array) {
      if (value.length === 0) return themetext(null, currentIndent, 'array syntax', '[]');
      return disclosure('[', options.collapseMessage(value.length), ']', 'array', () => {
        const array = append(span('array'), themetext('array syntax', '[', null, '\n'));
        for (let index = 0; index < value.length; index++) append(array, render(options.replacer.call(value, index, value[index]), `${indent}    `, false, showLevel - 1, options), index !== value.length - 1 ? themetext('syntax', ',') : [], text('\n'));
        return append(array, themetext(null, indent, 'array syntax', ']'));
      });
    }
    if (isempty(value, options.propertyList)) return themetext(null, currentIndent, 'object syntax', '{}');
    const rawKeys = Object.keys(value);
    return disclosure('{', options.collapseMessage(rawKeys.length), '}', 'object', () => {
      const object = append(span('object'), themetext('object syntax', '{', null, '\n'));
      const last = rawKeys.at(-1);
      let keys = options.propertyList || rawKeys;
      if (options.sortObjects) keys = keys.sort();
      for (const index in keys) {
        const key = keys[index];
        if (!(key in value)) continue;
        append(object, themetext(null, `${indent}    `, 'key', `"${key}"`, 'object syntax', ': '), render(options.replacer.call(value, key, value[key]), `${indent}    `, true, showLevel - 1, options), key !== last ? themetext('syntax', ',') : [], text('\n'));
      }
      return append(object, themetext(null, indent, 'object syntax', '}'));
    });
  }

  const renderjson = (json) => {
    const options = { ...renderjson.options };
    options.replacer = typeof options.replacer === 'function' ? options.replacer : (key, value) => value;
    const pre = append(document.createElement('pre'), render(json, '', false, options.showToLevel, options));
    pre.className = 'renderjson';
    return pre;
  };
  renderjson.setShowToLevel = (level) => {
    renderjson.options.showToLevel = typeof level === 'string' && level.toLowerCase() === 'all' ? Number.MAX_VALUE : level;
    return renderjson;
  };
  renderjson.options = {
    show: '⊕', hide: '⊖', showToLevel: 0, maxStringLength: Number.MAX_VALUE, sortObjects: false,
    collapseMessage: (length) => `${length} item${length === 1 ? '' : 's'}`,
  };
  return renderjson;
}());
