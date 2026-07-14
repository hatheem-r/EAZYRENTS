import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

// Themed replacement for window.confirm. The native dialog cannot be styled,
// so we render our own: useConfirm() returns confirm(message, options) which
// resolves to true/false — handlers simply `await` it where window.confirm
// used to be called.
const ConfirmContext = createContext(null)

export function ConfirmProvider({ children }) {
  const [request, setRequest] = useState(null)
  const cancelRef = useRef(null)

  const confirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      setRequest({
        message,
        confirmLabel: options.confirmLabel ?? 'Confirm',
        cancelLabel: options.cancelLabel ?? 'Keep it',
        resolve,
      })
    })
  }, [])

  function settle(result) {
    request?.resolve(result)
    setRequest(null)
  }

  // Escape closes as "no"; focus starts on the safe option.
  useEffect(() => {
    if (!request) return

    cancelRef.current?.focus()

    function onKeyDown(event) {
      if (event.key === 'Escape') settle(false)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request])

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {request && (
        <div
          className="confirm-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) settle(false)
          }}
        >
          <div
            className="confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-describedby="confirm-dialog-message"
          >
            <p id="confirm-dialog-message" className="confirm-dialog__message">
              {request.message}
            </p>
            <div className="confirm-dialog__actions">
              <button
                type="button"
                ref={cancelRef}
                className="btn btn--ghost btn--small"
                onClick={() => settle(false)}
              >
                {request.cancelLabel}
              </button>
              <button
                type="button"
                className="btn btn--danger btn--small"
                onClick={() => settle(true)}
              >
                {request.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const confirm = useContext(ConfirmContext)
  if (!confirm) {
    throw new Error('useConfirm must be used inside a ConfirmProvider')
  }
  return confirm
}
