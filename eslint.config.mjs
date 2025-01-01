import globals from 'globals';
import jsdoc from 'eslint-plugin-jsdoc';
import google from 'eslint-config-google';
import html from 'eslint-plugin-html';

google.name = 'Google';

/**
 * eslint does not include jsdoc since v9, so needs to be added to the Google
 * config manually now.
 * @type {{jsdoc: any}}
 */
google.plugins = {
  jsdoc,
};

/**
 * eslint-config-google contains deprecated rules keys that were moved to
 * the newer eslint-plugin-jsdoc.
 *
 * @see: https://eslint.org/docs/latest/use/migrate-to-9.0.0#remove-jsdoc-rules
 */
delete google.rules['require-jsdoc'];
google.rules['jsdoc/require-jsdoc'] = ['error', {
  'require': {
    FunctionDeclaration: true,
    MethodDefinition: true,
    ClassDeclaration: true,
  },
}];

// The 'valid-jsdoc' rule got broken down into separate rules within the plugin.
// See: https://github.com/gajus/eslint-plugin-jsdoc/wiki/Comparison-with-deprecated-JSdoc-related-ESLint-rules
delete google.rules['valid-jsdoc'];
google.rules['jsdoc/require-param-description'] = 'off';
google.rules['jsdoc/require-returns-description'] = 'off';
google.rules['jsdoc/require-returns'] = 'error';
google.settings = {
  jsdoc: {
    tagNamePreference: {
      'returns': 'return',
    }
  },
};

export default [
  // Temporarily ignoring tracker.js.  See tracker.js for details.
  {
    ignores: ['src/module/apps/tracker.js'],
  },
  google,
  {
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.jquery,
        ...globals.node,
        'Atomics': 'readonly',
        'SharedArrayBuffer': 'readonly',
        'ItemSheet': 'readonly',
        'game': 'readonly',
        'mergeObject': 'readonly',
        'CONFIG': 'writable',
        'duplicate': 'readonly',
        'Tabs': 'readonly',
        'Hooks': 'readonly',
        'Items': 'readonly',
        'loadTemplates': 'readonly',
        'Combat': 'writable',
        'canvas': 'readonly',
        'ActorSheet': 'readonly',
        'Actor': 'readonly',
        'Actors': 'readonly',
        'fetchSpell': 'readonly',
        'TextEditor': 'readonly',
        'ui': 'readonly'
      },
    },
    plugins: {
      html,
    },
    rules: {
      'arrow-body-style': 'off',
      'comma-dangle': 'off',
      'linebreak-style': ['error', 'windows'],
      'indent': ['error', 2],
      'import/extensions': 'off',
      'max-len': ['error', {'code': 110, 'ignoreComments': true, 'ignoreStrings': true, 'ignoreTemplateLiterals': true}],
      'no-async-promise-executor': 'off',
      'no-await-in-loop': 'off',
      'no-console': 'off',
      'no-empty-function': 'off',
      'jsdoc/require-jsdoc': 'off',
      'no-mixed-spaces-and-tabs': ['error', 'smart-tabs'],
      'no-restricted-syntax': 'off',
      'no-tabs': 'off',
      'no-trailing-spaces': 'off',
      'no-unused-vars': 'off',
      'no-useless-constructor': 'off',
    }
  },
];
