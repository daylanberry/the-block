import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { Provider } from 'react-redux'

import type { AppStore } from '../app/store'

export function renderWithStore(ui: ReactElement, store: AppStore) {
  return render(<Provider store={store}>{ui}</Provider>)
}
