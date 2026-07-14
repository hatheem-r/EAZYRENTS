import { useState } from 'react'
import { photoUrl } from '../../utils/imageUrl.js'
import { uploadVehiclePhotos, deleteVehiclePhoto } from '../../api/host.js'
import { ApiError } from '../../api/client.js'
import { useConfirm } from '../ConfirmDialog.jsx'

const MAX_FILES_PER_UPLOAD = 5
const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_PHOTOS_PER_VEHICLE = 10

function validateFiles(files) {
  if (files.length === 0) return 'Choose at least one photo'
  if (files.length > MAX_FILES_PER_UPLOAD) {
    return `You can upload at most ${MAX_FILES_PER_UPLOAD} photos at a time`
  }

  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `${file.name} is not a jpeg, png, or webp image`
    }
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name} is larger than 5MB`
    }
  }

  return ''
}

function PhotoManager({ vehicle, onChanged }) {
  const confirm = useConfirm()
  const [open, setOpen] = useState(false)
  const [files, setFiles] = useState(null)
  const [inputKey, setInputKey] = useState(0)
  const [uploadError, setUploadError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const photos = vehicle.photos ?? []

  function handleFileChange(event) {
    setUploadError('')
    setFiles(event.target.files)
  }

  async function handleUpload(event) {
    event.preventDefault()

    const fileList = files ? Array.from(files) : []
    const validationError = validateFiles(fileList)

    if (validationError) {
      setUploadError(validationError)
      return
    }

    setUploadError('')
    setUploading(true)

    try {
      await uploadVehiclePhotos(vehicle.id, fileList)
      setFiles(null)
      // <input type="file"> is uncontrolled — bumping its key remounts it
      // with a fresh, empty value.
      setInputKey((key) => key + 1)
      onChanged()
    } catch (err) {
      if (err instanceof ApiError) {
        setUploadError(err.message)
        if (err.status === 404) {
          // vehicle changed under us — resync
          onChanged()
        }
      } else {
        setUploadError('Something went wrong. Please try again.')
      }
    } finally {
      setUploading(false)
    }
  }

  async function handleDeletePhoto(url) {
    if (!(await confirm('Remove this photo?', { confirmLabel: 'Remove photo' }))) return

    setDeleteError('')

    try {
      await deleteVehiclePhoto(vehicle.id, url)
      onChanged()
    } catch (err) {
      if (err instanceof ApiError) {
        setDeleteError(err.message)
        if (err.status === 404) {
          onChanged()
        }
      } else {
        setDeleteError('Something went wrong. Please try again.')
      }
    }
  }

  return (
    <section className="photo-manager">
      <button
        type="button"
        className="btn btn--ghost btn--small photo-manager__toggle"
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        {open ? 'Hide photos' : `Photos (${photos.length})`}
      </button>

      {open && (
        <>
          <p className="photo-manager__count">
            {photos.length} of {MAX_PHOTOS_PER_VEHICLE} photos used
          </p>

          {deleteError && (
            <p className="form-error" role="alert">
              {deleteError}
            </p>
          )}

          {photos.length > 0 && (
            <ul className="photo-manager__list">
              {photos.map((url) => (
                <li key={url}>
                  <img src={photoUrl(url)} alt={`${vehicle.make} ${vehicle.model} photo`} />
                  <button
                    type="button"
                    className="btn btn--danger btn--small photo-manager__remove"
                    onClick={() => handleDeletePhoto(url)}
                    aria-label={`Remove photo of ${vehicle.make} ${vehicle.model}`}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form className="photo-upload-form" onSubmit={handleUpload}>
            {uploadError && (
              <p className="form-error" role="alert">
                {uploadError}
              </p>
            )}

            <div className="form-field">
              <label htmlFor={`photo-upload-${vehicle.id}`}>Add photos</label>
              <input
                key={inputKey}
                id={`photo-upload-${vehicle.id}`}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleFileChange}
                disabled={uploading}
              />
            </div>

            <button type="submit" className="btn btn--secondary btn--small" disabled={uploading}>
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
          </form>
        </>
      )}
    </section>
  )
}

export default PhotoManager
