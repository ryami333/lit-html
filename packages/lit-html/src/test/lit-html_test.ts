/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
import {
  html,
  noChange,
  nothing,
  render,
  svg,
  TemplateResult,
} from '../lib/lit-html.js';
import {chai} from '@bundled-es-modules/chai';
import {
  stripExpressionComments,
  stripExpressionMarkers,
} from './test-utils/strip-markers.js';

const {assert} = chai;

const ua = window.navigator.userAgent;
const isIe = ua.indexOf('Trident/') > 0;

suite('lit-html', () => {
  let container: HTMLDivElement;

  setup(() => {
    container = document.createElement('div');
  });

  const assertRender = (r: TemplateResult, expected: string) => {
    render(r, container);
    assert.equal(stripExpressionComments(container.innerHTML), expected);
  };

  /**
   * These test the ability to insert the correct expression marker into the
   * HTML string before being parsed by innerHTML. Some of the tests have
   * malformed HTML to test for reasonable (non-crashing) behavior in edge
   * cases, though the exact behavior is undefined.
   */
  suite('marker insertion', () => {
    test('only text', () => {
      assertRender(html`${'A'}`, 'A');
    });

    test('attribute-like text', () => {
      assertRender(html`a=${'A'}`, 'a=A');
    });

    test('text child', () => {
      assertRender(html`<div>${'A'}</div>`, '<div>A</div>');
    });

    test('text child of element with unquoted attribute', () => {
      assertRender(html`<div a="b">${'d'}</div>`, '<div a="b">d</div>');
    });

    test('text child of element with unquoted attribute', () => {
      assertRender(html`<div a="b">${'d'}</div>`, '<div a="b">d</div>');
    });

    test('renders parts with whitespace after them', () => {
      // prettier-ignore
      assertRender(html`<div>${'foo'} </div>`, '<div>foo </div>');
    });

    test('renders parts that look like attributes', () => {
      assertRender(html`<div>foo bar=${'baz'}</div>`, '<div>foo bar=baz</div>');
    });

    test('renders multiple parts per element, preserving whitespace', () => {
      assertRender(html`<div>${'foo'} ${'bar'}</div>`, '<div>foo bar</div>');
    });

    test('renders templates with comments', () => {
      // prettier-ignore
      assertRender(html`
        <div>
          <!-- this is a comment -->
          <h1 class="${'foo'}">title</h1>
          <p>${'foo'}</p>
        </div>`, `
        <div>
          <!-- this is a comment -->
          <h1 class="foo">title</h1>
          <p>foo</p>
        </div>`
      );
    });

    test('text after element', () => {
      // prettier-ignore
      assertRender(
        html`<div></div>${'A'}`,
        '<div></div>A'
      );
    });

    test('renders next templates with preceding elements', () => {
      assertRender(
        html`<a>${'foo'}</a>${html`<h1>${'bar'}</h1>`}`,
        '<a>foo</a><h1>bar</h1>'
      );
    });

    test('renders expressions with preceding elements', () => {
      // This is nearly the same test case as above, but was causing a
      // different stack trace
      assertRender(html`<a>${'foo'}</a>${'bar'}`, '<a>foo</a>bar');
    });

    test('text in raw text element after <', () => {
      // It doesn't matter much what marker we use in <script>, <style> and
      // <textarea> since comments aren't parsed and we have to search the text
      // anyway.
      // prettier-ignore
      assertRender(
        html`<script>i < j ${'A'}</script>`,
        '<script>i < j A</script>'
      );
    });

    test('text in raw text element after >', () => {
      // prettier-ignore
      assertRender(
        html`<script>i > j ${'A'}</script>`,
        '<script>i > j A</script>'
      );
    });

    test('text in raw text element inside tag-like string', () => {
      // prettier-ignore
      assertRender(
        html`<script>"<div a=${'A'}></div>";</script>`,
        '<script>"<div a=A></div>";</script>'
      );
    });

    test('renders inside <script>: only node', () => {
      // prettier-ignore
      assertRender(html`<script>${'foo'}</script>`, '<script>foo</script>');
    });

    test('renders inside <script>: first node', () => {
      // prettier-ignore
      assertRender(html`<script>${'foo'}A</script>`,'<script>fooA</script>');
    });

    test('renders inside <script>: last node', () => {
      // prettier-ignore
      assertRender(html`<script>A${'foo'}</script>`,'<script>Afoo</script>');
    });

    test('renders inside <script>: multiple bindings', () => {
      // prettier-ignore
      assertRender(
        html`<script>A${'foo'}B${'bar'}C</script>`,
        '<script>AfooBbarC</script>');
    });

    test('renders inside <script>: attribute-like', () => {
      // prettier-ignore
      assertRender(
        html`<script>a=${'foo'}</script>`,
        '<script>a=foo</script>');
    });

    test('text after script element', () => {
      // prettier-ignore
      assertRender(
        html`<script></script>${'A'}`,
        '<script></script>A'
      );
    });

    test('text after style element', () => {
      // prettier-ignore
      assertRender(html`<style></style>${'A'}`, '<style></style>A');
    });

    test('text inside raw text element, after different raw tag', () => {
      // prettier-ignore
      assertRender(
        html`<script><style></style>"<div a=${'A'}></div>"</script>`,
        '<script><style></style>"<div a=A></div>"</script>'
      );
    });

    test('text inside raw text element, after different raw end tag', () => {
      // prettier-ignore
      assertRender(
        html`<script></style>"<div a=${'A'}></div>"</script>`,
        '<script></style>"<div a=A></div>"</script>'
      );
    });

    test('attribute after raw text element', () => {
      // prettier-ignore
      assertRender(
        html`<script></script><div a=${'A'}></div>`,
        '<script></script><div a="A"></div>'
      );
    });

    test('unquoted attribute', () => {
      // prettier-ignore
      assertRender(html`<div a=${'A'}></div>`, '<div a="A"></div>');
      // prettier-ignore
      assertRender(html`<div abc=${'A'}></div>`, '<div abc="A"></div>');
      // prettier-ignore
      assertRender(html`<div abc = ${'A'}></div>`, '<div abc="A"></div>');
    });

    test('quoted attribute', () => {
      // prettier-ignore
      assertRender(html`<div a="${'A'}"></div>`, '<div a="A"></div>');
      // prettier-ignore
      assertRender(html`<div abc="${'A'}"></div>`, '<div abc="A"></div>');
      // prettier-ignore
      assertRender(html`<div abc = "${'A'}"></div>`, '<div abc="A"></div>');
    });

    test('second quoted attribute', () => {
      // prettier-ignore
      assertRender(
        html`<div a="b" c="${'A'}"></div>`,
        '<div a="b" c="A"></div>'
      );
    });

    test('two quoted attributes', () => {
      // prettier-ignore
      assertRender(
        html`<div a="${'A'}" b="${'A'}"></div>`,
        '<div a="A" b="A"></div>'
      );
    });

    test('two unquoted attributes', () => {
      // prettier-ignore
      assertRender(
        html`<div a=${'A'} b=${'A'}></div>`,
        '<div a="A" b="A"></div>'
      );
    });

    test('quoted attribute multi', () => {
      assertRender(html`<div a="${'A'} ${'A'}"></div>`, '<div a="A A"></div>');
    });

    test('quoted attribute with markup', () => {
      // prettier-ignore
      assertRender(
        html`<div a="<table>${'A'}"></div>`,
        '<div a="<table>A"></div>'
      );
    });

    test('text after quoted attribute', () => {
      assertRender(html`<div a="${'A'}">${'A'}</div>`, '<div a="A">A</div>');
    });

    test('text after unquoted attribute', () => {
      assertRender(html`<div a=${'A'}>${'A'}</div>`, '<div a="A">A</div>');
    });

    // test('inside start tag', () => {
    //   assertRender(html`<div ${attr`a="b"`}></div>`, '<div a="b"></div>');
    // });

    // test('inside start tag x2', () => {
    //   // We don't support multiple attribute-position bindings yet, so just
    //   // ensure this parses ok
    //   assertRender(
    //     html`<div ${attr`a="b"`} ${attr`c="d"`}></div>`,
    //     '<div a="b"></div>'
    //   );
    // });

    // test('inside start tag after unquoted attribute', () => {
    //   // prettier-ignore
    //   assertRender(html`<div a=b ${attr`c="d"`}></div>`, '<div a="b" c="d"></div>');
    // });

    // test('inside start tag after quoted attribute', () => {
    //   // prettier-ignore
    //   assertRender(html`<div a="b" ${attr`c="d"`}></div>`, '<div a="b" c="d"></div>');
    // });

    // test('inside start tag before unquoted attribute', () => {
    //   // bound attributes always appear after static attributes
    //   assertRender(
    //     html`<div ${attr`c="d"`} a="b"></div>`,
    //     '<div a="b" c="d"></div>'
    //   );
    // });

    // test('inside start tag before quoted attribute', () => {
    //   // bound attributes always appear after static attributes
    //   assertRender(
    //     html`<div ${attr`c="d"`} a="b"></div>`,
    //     '<div a="b" c="d"></div>'
    //   );
    // });

    test('"dynamic" tag name', () => {
      render(html`<${'A'}></${'A'}>`, container);
      assert.equal(stripExpressionMarkers(container.innerHTML), '<></>');
    });

    test('after tag name', () => {
      // we don't really care what the syntax position is here
      assertRender(html`<div></div ${'A'}>`, '<div></div>');
    });

    test('comment', () => {
      render(html`<!--${'A'}-->`, container);
      assert.equal(stripExpressionMarkers(container.innerHTML), '<!---->');
    });

    test('comment with attribute-like content', () => {
      render(html`<!-- a=${'A'}-->`, container);
      assert.equal(stripExpressionMarkers(container.innerHTML), '<!-- a=-->');
    });

    test('comment with element-like content', () => {
      render(html`<!-- <div>${'A'}</div> -->`, container);
      assert.equal(
        stripExpressionMarkers(container.innerHTML),
        '<!-- <div></div> -->'
      );
    });

    test('text after comment', () => {
      assertRender(html`<!-- -->${'A'}`, '<!-- -->A');
    });
  });

  suite('text', () => {
    test('renders plain text expression', () => {
      render(html`test`, container);
      assert.equal(stripExpressionComments(container.innerHTML), 'test');
    });

    test('renders a string', () => {
      render(html`<div>${'foo'}</div>`, container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div>foo</div>'
      );
    });

    test('renders a number', () => {
      render(html`<div>${123}</div>`, container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div>123</div>'
      );
    });

    test('renders undefined as empty string', () => {
      render(html`<div>${undefined}</div>`, container);
      assert.equal(stripExpressionComments(container.innerHTML), '<div></div>');
    });

    test('renders null as empty string', () => {
      render(html`<div>${null}</div>`, container);
      assert.equal(stripExpressionComments(container.innerHTML), '<div></div>');
    });

    test('renders noChange', () => {
      const template = (i: any) => html`<div>${i}</div>`;
      render(template('foo'), container);
      render(template(noChange), container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div>foo</div>'
      );
    });

    test('renders nothing', () => {
      const template = (i: any) => html`<div>${i}</div>`;
      render(template('foo'), container);
      render(template(nothing), container);
      const children = Array.from(container.querySelector('div')!.childNodes);
      assert.isEmpty(
        children.filter((node) => node.nodeType !== Node.COMMENT_NODE)
      );
    });

    test.skip('renders a Symbol', () => {
      render(html`<div>${Symbol('A')}</div>`, container);
      assert.include(
        container.querySelector('div')!.textContent!.toLowerCase(),
        'symbol'
      );
    });

    test('does not call a function bound to text', () => {
      const f = () => {
        throw new Error();
      };
      render(html`${f}`, container);
    });

    test('renders nested templates', () => {
      const partial = html`<h1>${'foo'}</h1>`;
      render(html`${partial}${'bar'}`, container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<h1>foo</h1>bar'
      );
    });

    test('renders a template nested multiple times', () => {
      const partial = html`<h1>${'foo'}</h1>`;
      render(html`${partial}${'bar'}${partial}${'baz'}qux`, container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<h1>foo</h1>bar<h1>foo</h1>bazqux'
      );
    });

    test('renders an element', () => {
      const child = document.createElement('p');
      render(html`<div>${child}</div>`, container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div><p></p></div>'
      );
    });

    test('renders forms as elements', () => {
      // forms are both Node and iterable

      const form = document.createElement('form');
      const inputOne = document.createElement('input');
      inputOne.name = 'one';
      const inputTwo = document.createElement('input');
      inputTwo.name = 'two';

      form.appendChild(inputOne);
      form.appendChild(inputTwo);

      render(html`${form}`, container);

      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<form><input name="one"><input name="two"></form>'
      );
    });
  });

  suite('svg', () => {
    test('renders SVG', () => {
      const container = document.createElement('svg');
      const t = svg`<line y1="1" y2="1"/>`;
      render(t, container);
      const line = container.firstElementChild!;
      assert.equal(line.tagName, 'line');
      assert.equal(line.namespaceURI, 'http://www.w3.org/2000/svg');
    });
  });

  suite('attributes', () => {
    test('renders to a quoted attribute', () => {
      render(html`<div foo="${'bar'}"></div>`, container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div foo="bar"></div>'
      );
    });

    test('renders to an unquoted attribute', () => {
      render(html`<div foo=${'bar'}></div>`, container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div foo="bar"></div>'
      );
    });

    test('renders interpolation to an attribute', () => {
      render(html`<div foo="A${'B'}C"></div>`, container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div foo="ABC"></div>'
      );
    });

    test('renders multiple bindings in an attribute', () => {
      render(html`<div foo="a${'b'}c${'d'}e"></div>`, container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div foo="abcde"></div>'
      );
    });

    test('renders two attributes on one element', () => {
      const result = html`<div a="${1}" b="${2}"></div>`;
      render(result, container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div a="1" b="2"></div>'
      );
    });

    test('renders multiple bindings in two attributes', () => {
      render(
        html`<div foo="a${'b'}c${'d'}e" bar="a${'b'}c${'d'}e"></div>`,
        container
      );
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div foo="abcde" bar="abcde"></div>'
      );
    });

    test.skip('renders a Symbol to an attribute', () => {
      render(html`<div foo=${Symbol('A')}></div>`, container);
      assert.include(
        container.querySelector('div')!.getAttribute('foo')!.toLowerCase(),
        'symbol'
      );
    });

    test.skip('renders a Symbol in an array to an attribute', () => {
      render(html`<div foo=${[Symbol('A')] as any}></div>`, container);
      assert.include(
        container.querySelector('div')!.getAttribute('foo')!.toLowerCase(),
        'symbol'
      );
    });

    test('renders a binding in a style attribute', () => {
      const t = html`<div style="color: ${'red'}"></div>`;
      render(t, container);
      if (isIe) {
        assert.equal(
          stripExpressionComments(container.innerHTML),
          '<div style="color: red;"></div>'
        );
      } else {
        assert.equal(
          stripExpressionComments(container.innerHTML),
          '<div style="color: red"></div>'
        );
      }
    });

    test('renders multiple bindings in a style attribute', () => {
      const t = html`<div style="${'color'}: ${'red'}"></div>`;
      render(t, container);
      if (isIe) {
        assert.equal(
          stripExpressionComments(container.innerHTML),
          '<div style="color: red;"></div>'
        );
      } else {
        assert.equal(
          stripExpressionComments(container.innerHTML),
          '<div style="color: red"></div>'
        );
      }
    });

    test('renders a binding in a class attribute', () => {
      render(html`<div class="${'red'}"></div>`, container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div class="red"></div>'
      );
    });

    test('renders a binding in an input value attribute', () => {
      render(html`<input value="${'the-value'}" />`, container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<input value="the-value">'
      );
      assert.equal(container.querySelector('input')!.value, 'the-value');
    });

    test('renders a case-sensitive attribute', () => {
      const size = 100;
      render(html`<svg viewBox="0 0 ${size} ${size}"></svg>`, container);
      assert.include(
        stripExpressionComments(container.innerHTML),
        'viewBox="0 0 100 100"'
      );

      // Make sure non-alpha valid attribute name characters are handled
      render(html`<svg view_Box="0 0 ${size} ${size}"></svg>`, container);
      assert.include(
        stripExpressionComments(container.innerHTML),
        'view_Box="0 0 100 100"'
      );
    });

    test('renders to an attribute expression after an attribute literal', () => {
      render(html`<div a="b" foo="${'bar'}"></div>`, container);
      // IE and Edge can switch attribute order!
      assert.include(
        ['<div a="b" foo="bar"></div>', '<div foo="bar" a="b"></div>'],
        stripExpressionComments(container.innerHTML)
      );
    });

    test('renders to an attribute expression before an attribute literal', () => {
      render(html`<div foo="${'bar'}" a="b"></div>`, container);
      // IE and Edge can switch attribute order!
      assert.include(
        ['<div a="b" foo="bar"></div>', '<div foo="bar" a="b"></div>'],
        stripExpressionComments(container.innerHTML)
      );
    });

    // Regression test for exception in template parsing caused by attributes
    // reordering when a attribute binding precedes an attribute literal.
    test('renders attribute binding after attribute binding that moved', () => {
      render(
        html`<a href="${'foo'}" class="bar"><div id=${'a'}></div></a>`,
        container
      );
      assert.equal(
        stripExpressionComments(container.innerHTML),
        `<a class="bar" href="foo"><div id="a"></div></a>`
      );
    });

    test('renders to an attribute without quotes', () => {
      render(html`<div foo=${'bar'}></div>`, container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div foo="bar"></div>'
      );
    });

    test('renders to multiple attribute expressions', () => {
      render(
        html`<div foo="${'Foo'}" bar="${'Bar'}" baz=${'Baz'}></div>`,
        container
      );
      assert.oneOf(stripExpressionComments(container.innerHTML), [
        '<div foo="Foo" bar="Bar" baz="Baz"></div>',
        '<div foo="Foo" baz="Baz" bar="Bar"></div>',
        '<div bar="Bar" foo="Foo" baz="Baz"></div>',
      ]);
    });

    test('renders to attributes with attribute-like values', () => {
      render(html`<div foo="bar=${'foo'}"></div>`, container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div foo="bar=foo"></div>'
      );
    });

    test('does not call a function bound to an attribute', () => {
      const f = () => {
        throw new Error();
      };
      render(html`<div foo=${f as any}></div>`, container);
      const div = container.querySelector('div')!;
      assert.isTrue(div.hasAttribute('foo'));
    });

    test('renders an array to an attribute', () => {
      render(html`<div foo=${[1, 2, 3] as any}></div>`, container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div foo="1,2,3"></div>'
      );
    });

    test('renders to an attribute before a node', () => {
      render(html`<div foo="${'bar'}">${'baz'}</div>`, container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div foo="bar">baz</div>'
      );
    });

    test('renders to an attribute after a node', () => {
      // prettier-ignore
      render(html`<div>${'baz'}</div><div foo="${'bar'}"></div>`, container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div>baz</div><div foo="bar"></div>'
      );
    });

    test('renders undefined in attributes', () => {
      render(html`<div attribute="it's ${undefined}"></div>`, container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div attribute="it\'s "></div>'
      );
    });

    test('renders undefined in attributes', () => {
      render(html`<div attribute="${undefined}"></div>`, container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div attribute=""></div>'
      );
    });

    test('nothing sentinel removes an attribute', () => {
      render(html`<div attribute=${nothing}></div>`, container);
      assert.equal(stripExpressionComments(container.innerHTML), '<div></div>');
    });

    test('interpolated nothing sentinel removes an attribute', () => {
      render(html`<div attribute="it's ${nothing}"></div>`, container);
      assert.equal(stripExpressionComments(container.innerHTML), '<div></div>');
    });

    test('noChange works', () => {
      const go = (v: any) => render(html`<div foo=${v}></div>`, container);
      go('A');
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div foo="A"></div>',
        'A'
      );
      go(noChange);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div foo="A"></div>',
        'B'
      );
    });

    test('noChange works on one of multiple expressions', () => {
      const go = (a: any, b: any) =>
        render(html`<div foo="${a}:${b}"></div>`, container);
      go('A', 'B');
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div foo="A:B"></div>',
        'A'
      );
      go(noChange, 'C');
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div foo="A:C"></div>',
        'B'
      );
    });
  });

  suite('boolean attributes', () => {
    test('adds attributes for true values', () => {
      render(html`<div ?foo=${true}></div>`, container);
      assert.equal(
        stripExpressionComments(container.innerHTML),
        '<div foo=""></div>'
      );
    });

    test('removes attributes for true values', () => {
      render(html`<div ?foo=${false}></div>`, container);
      assert.equal(stripExpressionComments(container.innerHTML), '<div></div>');
    });
  });

  suite('properties', () => {
    test('sets properties', () => {
      render(html`<div .foo=${123} .Bar=${456}></div>`, container);
      const div = container.querySelector('div')!;
      assert.strictEqual((div as any).foo, 123);
      assert.strictEqual((div as any).Bar, 456);
    });
  });
});
