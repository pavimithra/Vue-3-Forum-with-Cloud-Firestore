import db from '@/config/firebase'
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "firebase/auth";

export default {
  namespaced: true,
  state: {
    authId: null,
    authUserUnsubscribe: null,
    authObserverUnsubscribe: null
  },
  getters: {
    authUser: (state, getters, rootState, rootGetters) => {
      return rootGetters['users/user'](state.authId)
    }
  },
  actions: {
    initAuthentication ({ dispatch, commit, state }) {
      if (state.authObserverUnsubscribe) state.authObserverUnsubscribe()
      return new Promise((resolve) => {
        const auth = getAuth()
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          console.log('👣 the user has changed')
          dispatch('unsubscribeAuthUserSnapshot')
          if (user) {
            await dispatch('fetchAuthUser')
            resolve(user)
          } else {
            resolve(null)
          }
        })
        commit('setAuthObserverUnsubscribe', unsubscribe)
      })
    },
    async registerUserWithEmailAndPassword ({ dispatch }, { avatar = null, email, name, username, password }) {
      const auth = getAuth()
      const result = await createUserWithEmailAndPassword(auth, email, password)
      await dispatch('users/createUser', { id: result.user.uid, email, name, username, avatar }, { root: true })
    },
    signInWithEmailAndPassword (context, { email, password }) {
      const auth = getAuth()
      return signInWithEmailAndPassword(auth, email, password)
    },
    async signInWithGoogle ({ dispatch }) {
      const provider = new GoogleAuthProvider()
      const auth = getAuth()
      await signInWithPopup(auth, provider)
      .then((response) => {
        const user = response.user
        const userRef = doc(db, "users", user.uid)
        const userDoc = getDoc(userRef)
        if (!userDoc.exists) {
          return dispatch('users/createUser',
            { id: user.uid, name: user.displayName, email: user.email, username: user.email, avatar: user.photoURL },
            { root: true }
          )
        }
      })
    },
    async signOut ({ commit }) {
      const auth = getAuth()
      await signOut(auth)
      commit('setAuthId', null)
    },
    fetchAuthUser: async ({ dispatch, state, commit }) => {
      const auth = getAuth()
      const userId = auth.currentUser?.uid
      if (!userId) return
      await dispatch('fetchItem', {
        emoji: '🙋',
        resource: 'users',
        id: userId,
        handleUnsubscribe: (unsubscribe) => {
          commit('setAuthUserUnsubscribe', unsubscribe)
        }
      },
      { root: true }
      )
      commit('setAuthId', userId)
    },
    async fetchAuthUsersPosts ({ commit, state }) {
      const q = query(collection(db, "posts"), where("userId", "==", state.authId))
      const posts = await getDocs(q)
      posts.forEach((item) => {
        commit('setItem', { resource: 'posts', item }, { root: true })
      });
    },
    async unsubscribeAuthUserSnapshot ({ state, commit }) {
      if (state.authUserUnsubscribe) {
        state.authUserUnsubscribe()
        commit('setAuthUserUnsubscribe', null)
      }
    }
  },
  mutations: {
    setAuthId (state, id) {
      state.authId = id
    },
    setAuthUserUnsubscribe (state, unsubscribe) {
      state.authUserUnsubscribe = unsubscribe
    },
    setAuthObserverUnsubscribe (state, unsubscribe) {
      state.authObserverUnsubscribe = unsubscribe
    }
  }
}
