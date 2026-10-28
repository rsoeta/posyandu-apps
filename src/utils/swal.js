import Swal from 'sweetalert2'

// Base mixin tuned for mobile + desktop
const baseMixin = Swal.mixin({
  buttonsStyling: true,
  customClass: {
    popup: 'posy-popup',
    title: 'posy-title',
    htmlContainer: 'posy-html',
    confirmButton: 'posy-confirm',
    cancelButton: 'posy-cancel',
  },
})

// Success toast-style dialog (auto close)
export const showSuccess = (message = 'Berhasil disimpan!') =>
  baseMixin.fire({
    icon: 'success',
    title: 'Berhasil',
    text: message,
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
  })

// Info dialog
export const showInfo = (title, message) =>
  baseMixin.fire({
    icon: 'info',
    title,
    text: message,
    confirmButtonText: 'OK',
  })

// Error dialog
export const showError = (title = 'Terjadi Kesalahan', message = '') =>
  baseMixin.fire({
    icon: 'error',
    title,
    text: message,
    confirmButtonText: 'OK',
  })

// Confirm dialog (replaces confirm())
export const showConfirm = (title = 'Yakin?', text = '', confirmText = 'Ya') =>
  baseMixin.fire({
    icon: 'question',
    title,
    text,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: 'Batal',
    reverseButtons: true,
  })

export default baseMixin
