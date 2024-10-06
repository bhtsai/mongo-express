import $ from 'jquery';
import { Modal } from 'bootstrap';
import editor from './editor.js';

const doc = editor(document.querySelector('#document'), {
  readOnly: ME_SETTINGS.readOnly,
});

window.onBackClick = function () {
  // "Back" button is clicked

  if (doc.contentDOM.cmView.domChanged == null) {
    window.history.back();
  } else if ($('#discardChanges').length === 0) {
    $('#pageTitle').parent().append(
      '<div id="discardChanges" class="alert alert-warning"><strong>Document has changed! Are you sure you wish to go back?</strong></div>',
    );
    $('.backButton').each(function () {
      $(this).text('Back & Discard Changes');
      $(this).addClass('col-md-2');
    });
  } else {
    window.history.back();
  }

  return false;
};

window.onSubmitClick = function () {
  // Save button is clicked
  $('#discardChanges').remove();

  const csrfToken = document.getElementsByName('_csrf')[0].value;

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
