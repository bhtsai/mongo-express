import $ from 'jquery';
import { Modal } from 'bootstrap';
import {
  foldEffect, foldNodeProp, syntaxTree, unfoldAll,
} from '@codemirror/language';
import editor from './editor.js';

const doc = editor(document.querySelector('#document'), {
  readOnly: ME_SETTINGS.readOnly,
});

let isJsonCollapsed = false;

const getFoldRange = (node) => {
  const fold = node.type.prop(foldNodeProp);
  return fold ? fold(node, doc.state) : null;
};

const getFirstLevelFoldRanges = () => {
  const findRoot = (node) => {
    if (getFoldRange(node)) return node;

    for (let child = node.firstChild; child; child = child.nextSibling) {
      const root = findRoot(child);
      if (root) return root;
    }

    return null;
  };
  const root = findRoot(syntaxTree(doc.state).topNode);
  const ranges = [];

  const findChildren = (node) => {
    for (let child = node.firstChild; child; child = child.nextSibling) {
      const range = getFoldRange(child);
      if (range) {
        ranges.push(range);
      } else {
        findChildren(child);
      }
    }
  };

  if (root) findChildren(root);
  return ranges;
};

globalThis.onToggleJsonFoldClick = function () {
  const toggleButton = document.querySelector('#toggleJsonFoldButton');

  if (isJsonCollapsed) {
    unfoldAll(doc);
    toggleButton.innerHTML = '<i class="fa fa-compress"></i> Collapse JSON';
  } else {
    const effects = getFirstLevelFoldRanges().map((range) => foldEffect.of(range));
    if (effects.length > 0) doc.dispatch({ effects });
    toggleButton.innerHTML = '<i class="fa fa-expand"></i> Expand JSON';
  }

  isJsonCollapsed = !isJsonCollapsed;
  return false;
};

globalThis.onBackClick = function () {
  // "Back" button is clicked

  if (doc.contentDOM.cmView.domChanged == null) {
    globalThis.history.back();
  } else if ($('#discardChanges').length === 0) {
    $('#pageTitle').parent().append(
      '<div id="discardChanges" class="alert alert-warning"><strong>Document has changed! Are you sure you wish to go back?</strong></div>',
    );
    $('.backButton').each(function () {
      $(this).text('Back & Discard Changes');
      $(this).addClass('col-md-2');
    });
  } else {
    globalThis.history.back();
  }

  return false;
};

globalThis.onSubmitClick = function () {
  // Save button is clicked
  $('#discardChanges').remove();

  const csrfToken = document.querySelector('[name="_csrf"]').value;

  $.ajax({
    type: 'POST',
    url: `${ME_SETTINGS.baseHref}checkValid`,
    data: {
      document: doc.getValue(),
    },
    beforeSend: (request) => request.setRequestHeader('X-CSRF-TOKEN', csrfToken),
  }).done((data) => {
    if (data === 'Valid') {
      $('#documentInvalidJSON').remove();
      $('#documentEditForm').submit();
    } else if ($('#documentInvalidJSON').length === 0) {
      $('#pageTitle').parent().append('<div id="documentInvalidJSON" class="alert alert-danger"><strong>Invalid JSON</strong></div>');
    }
  });
  return false;
};

$(() => {
  $('.deleteButtonDocument').on('click', function (e) {
    const $form = $(this).closest('form');
    e.stopPropagation();
    e.preventDefault();

    if (ME_SETTINGS.confirmDelete) {
      const $target = $('#confirm-document-delete');
      const modal = new Modal($target, { backdrop: 'static', keyboard: false });

      $target
        .one('click', '#delete', function () {
          $form.trigger('submit'); // submit the form
        });
      modal.show();
    } else {
      $form.trigger('submit');
    }
  });
});
