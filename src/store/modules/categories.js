import db from '@/config/firebase'
import { onSnapshot, collection, query } from "firebase/firestore"

export default {
  namespaced: true,
  state: {
    items: []
  },
  getters: {},
  actions: {
    fetchCategory: ({ dispatch }, { id }) => dispatch('fetchItem',
      { emoji: '🏷', resource: 'categories', id },
      { root: true }
    ),
    fetchCategories: ({ dispatch }, { ids }) => dispatch('fetchItems',
      { resource: 'categories', ids, emoji: '🏷' },
      { root: true }
    ),
    fetchAllCategories ({ commit }) {
      console.log('🔥', '🏷', 'all')
      return new Promise((resolve) => {
        onSnapshot(query(collection(db, "categories")), (querySnapshot) => {
          const categories = querySnapshot.docs.map(doc => {
            const item = { id: doc.id, ...doc.data() }
            commit('setItem', { resource: 'categories', item }, { root: true })
            return item
          })
          resolve(categories)
        })
      })
    }
  },
  mutations: {}
}
