import { findById, docToResource, makeAppendChildToParentMutation } from '@/helpers'
import db from '@/config/firebase'
import { doc, getDoc, collection, arrayUnion, writeBatch } from "firebase/firestore"

export default {
  namespaced: true,
  state: {
    items: []
  },
  getters: {
    thread: (state, getters, rootState) => {
      return (id) => {
        const thread = findById(state.items, id)
        if (!thread) return {}
        return {
          ...thread,
          get author () {
            return findById(rootState.users.items, thread.userId)
          },
          get repliesCount () {
            return thread.posts.length - 1
          },
          get contributorsCount () {
            return thread.contributors.length
          }
        }
      }
    }
  },
  actions: {
    async createThread ({ commit, state, dispatch, rootState }, { text, title, forumId }) {
      const userId = rootState.auth.authId
      const publishedAt = Math.floor(Date.now() / 1000)
      // Get a new write batch
      const batch = writeBatch(db)

      const threadRef = doc(collection(db, "threads"))
      const thread = { forumId, title, publishedAt, userId, id: threadRef.id }
      batch.set(threadRef, thread)
      
      const userRef = doc(db, "users", userId)
      const forumRef = doc(db, "forums", forumId)

      batch.update(userRef, {
        threads: arrayUnion(threadRef.id)
      })
      batch.update(forumRef, {
        threads: arrayUnion(threadRef.id)
      })

      await batch.commit()
      const newThread = await getDoc(threadRef)

      commit('setItem', {
        resource: 'threads',
        item: { ...newThread.data(), id: newThread.id }
      },
      { root: true }
      )
      commit('users/appendThreadToUser', { parentId: userId, childId: threadRef.id }, { root: true })
      commit('forums/appendThreadToForum', { parentId: forumId, childId: threadRef.id }, { root: true })
      await dispatch('posts/createPost', { text, threadId: threadRef.id }, { root: true })
      return findById(state.items, threadRef.id)
    },
    async updateThread ({ commit, state, rootState }, { title, text, id }) {
      const thread = findById(state.items, id)
      const post = findById(rootState.posts.items, thread.posts[0])
      let newThread = { ...thread, title }
      let newPost = { ...post, text }

      // Get a new write batch
      const batch = writeBatch(db)
  
      const threadRef = doc(db, "threads", id)
      batch.update(threadRef, newThread)
  
      const postRef = doc(db, "posts", post.id)
      batch.update(postRef, newPost)
  
      await batch.commit()
  
      newThread = await getDoc(threadRef)
      newPost = await getDoc(postRef)

      commit('setItem', { resource: 'threads', item: newThread }, { root: true })
      commit('setItem', { resource: 'posts', item: newPost }, { root: true })
      return docToResource(newThread)
    },
    fetchThread: ({ dispatch }, { id }) => dispatch('fetchItem', { emoji: '📄', resource: 'threads', id }, { root: true }),
    fetchThreads: ({ dispatch }, { ids }) => dispatch('fetchItems', { resource: 'threads', ids, emoji: '📄' }, { root: true })
  },
  mutations: {
    appendPostToThread: makeAppendChildToParentMutation({ parent: 'threads', child: 'posts' }),
    appendContributorToThread: makeAppendChildToParentMutation({ parent: 'threads', child: 'contributors' })
  }
}
