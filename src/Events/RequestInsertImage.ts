export interface RequestInsertImageEventTypes extends Event {
  detail: {
    onInsert: Function
  }
}

interface OnInsertSelectedImageArgs {

}

interface RequestInsertImageArgs {
  onInsert: Function
}

function requestInsertImage(requestArgs: RequestInsertImageArgs) {
  const requestEvent = new CustomEvent('requestInsertImage', {
    detail: {
      onInsert: requestArgs.onInsert
    }
  })
  window.dispatchEvent(requestEvent)
}

export { requestInsertImage }