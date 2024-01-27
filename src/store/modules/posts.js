import db from '@/config/firebase'
import { doc, getDoc, updateDoc, collection, arrayUnion, writeBatch, increment } from "firebase/firestore"

export default {
  namespaced: true,
  state: {
    items: []
  },
  getters: {},
  actions: {
    async createPost ({ commit, state, rootState }, post) {
      post.userId = rootState.auth.authId
      post.publishedAt = Math.floor(Date.now() / 1000)
      // Get a new write batch
      const batch = writeBatch(db)
  
      const postRef = doc(collection(db, "posts"))
      batch.set(postRef, post)
  
      const threadRef = doc(db, "threads", post.threadId)
      batch.update(threadRef, {
        posts: arrayUnion(postRef.id),
        contributors: arrayUnion(rootState.auth.authId)
      })
  
      const userRef = doc(db, "users", rootState.auth.authId)
      batch.update(userRef, {
        postsCount: increment(1)
      })
      // Commit the batch
      await batch.commit()
  
      const newPost = await getDoc(postRef)
      commit('setItem', { resource: 'posts', item: { ...newPost.data(), id: newPost.id } }, { root: true }) // set the post
      commit('threads/appendPostToThread', { childId: newPost.id, parentId: post.threadId }, { root: true }) // append post to thread
      commit('threads/appendContributorToThread', { childId: rootState.auth.authId, parentId: post.threadId }, { root: true })
    },
    async updatePost ({ commit, state, rootState }, { text, id }) {
      const post = {
        text,
        edited: {
          at: Math.floor(Date.now() / 1000),
          by: rootState.auth.authId,
          moderated: false
        }
      }
      const postRef = doc(db, "posts", id)
      await updateDoc(postRef, post)
      const updatedPost = await getDoc(postRef)
      commit('setItem', { resource: 'posts', item: updatedPost }, { root: true })
    },
    fetchPost: ({ dispatch }, { id }) => dispatch('fetchItem', { emoji: '💬', resource: 'posts', id }, { root: true }),
    fetchPosts: ({ dispatch }, { ids }) => dispatch('fetchItems', { resource: 'posts', ids, emoji: '💬' }, { root: true })
  },
  mutations: {}
}
