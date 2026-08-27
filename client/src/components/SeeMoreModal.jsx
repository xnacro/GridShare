import { Modal } from '@heroui/react'

// Thin, controlled wrapper around HeroUI's Modal, reused wherever a card's
// preview list needs a "See more" popup showing the full list. The modal
// chrome is identical everywhere; each caller supplies its own already-built
// item-rendering JSX as children.
export default function SeeMoreModal({ isOpen, onOpenChange, title, children }) {
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>{title}</Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>
            <Modal.Body className="max-h-[70vh] overflow-y-auto">{children}</Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}
