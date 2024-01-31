import db from '@/config/firebase'
import { doc, onSnapshot } from "firebase/firestore";

export default {

  fetchItem ({ state, commit }, { id, emoji, resource, handleUnsubscribe = null }) {
    return new Promise((resolve) => {
      const unsubscribe = onSnapshot(doc(db, resource, id), (doc) => {
        if (doc.exists) {
          const item = { ...doc.data(), id: doc.id }
          commit('setItem', { resource, item })
          resolve(item)
        } else {
          resolve(null)
        }
      })
      if (handleUnsubscribe) {
        handleUnsubscribe(unsubscribe)
      } else {
        commit('appendUnsubscribe', { unsubscribe })
      }
    })
  },
  fetchItems ({ dispatch }, { ids, resource, emoji }) {
    ids = ids || []
    return Promise.all(ids.map(id => dispatch('fetchItem', { id, resource, emoji })))
  },
  async unsubscribeAllSnapshots ({ state, commit }) {
    state.unsubscribes.forEach(unsubscribe => unsubscribe())
    commit('clearAllUnsubscribes')
  },
  clearItems ({ commit }, { modules = [] }) {
    commit('clearItems', { modules })
  }
}