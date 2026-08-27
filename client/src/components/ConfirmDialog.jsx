import { AlertDialog, Button } from '@heroui/react'

// Thin, controlled wrapper around HeroUI's AlertDialog, reused wherever an
// action needs an explicit confirm step before it changes state (listing
// or buying on the Marketplace) rather than firing immediately on click.
export default function ConfirmDialog({
  isOpen,
  onOpenChange,
  heading,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isConfirming = false,
}) {
  return (
    <AlertDialog isOpen={isOpen} onOpenChange={onOpenChange}>
      <AlertDialog.Backdrop>
        <AlertDialog.Container>
          <AlertDialog.Dialog>
            <AlertDialog.Header>
              <AlertDialog.Heading>{heading}</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>{children}</AlertDialog.Body>
            <AlertDialog.Footer>
              <Button variant="outline" onClick={onCancel} isDisabled={isConfirming}>{cancelLabel}</Button>
              <Button variant="primary" onClick={onConfirm} isDisabled={isConfirming}>
                {isConfirming ? 'Please wait…' : confirmLabel}
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  )
}
