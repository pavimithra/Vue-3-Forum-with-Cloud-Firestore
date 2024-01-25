import { findById, docToResource } from '@/helpers'
import db from '@/config/firebase'
import { doc, getDoc, updateDoc, onSnapshot, collection, query, arrayUnion, writeBatch, increment } from "firebase/firestore";

export default {
  async createPost ({ commit, state }, post) {
    post.userId = state.authId
    post.publishedAt = Math.floor(Date.now() / 1000)
    // Get a new write batch
    const batch = writeBatch(db)

    const postRef = doc(collection(db, "posts"))
    batch.set(postRef, post)

    const threadRef = doc(db, "threads", post.threadId)
    batch.update(threadRef, {
      posts: arrayUnion(postRef.id),
      contributors: arrayUnion(state.authId)
    })

    const userRef = doc(db, "users", state.authId)
    batch.update(userRef, {
      postsCount: increment(1)
    })
    // Commit the batch
    await batch.commit()

    const newPost = await getDoc(postRef)
    commit('setItem', { resource: 'posts', item: { ...newPost.data(), id: newPost.id } }) // set the post
    commit('appendPostToThread', { childId: newPost.id, parentId: post.threadId }) // append post to thread
    commit('appendContributorToThread', { childId: state.authId, parentId: post.threadId })
  },
  async updatePost ({ commit, state }, { text, id }) {
    const post = {
      text,
      edited: {
        at: Math.floor(Date.now() / 1000),
        by: state.authId,
        moderated: false
      }
    }
    const postRef = doc(db, "posts", id)
    await updateDoc(postRef, post);
    const updatedPost = await getDoc(postRef)
    commit('setItem', { resource: 'posts', item: updatedPost })
  },
  async createThread ({ commit, state, dispatch }, { text, title, forumId }) {
    const userId = state.authId
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

    commit('setItem', { resource: 'threads', item: { ...newThread.data(), id: newThread.id } })
    commit('appendThreadToUser', { parentId: userId, childId: threadRef.id })
    commit('appendThreadToForum', { parentId: forumId, childId: threadRef.id })
    await dispatch('createPost', { text, threadId: threadRef.id })
    return findById(state.threads, threadRef.id)
  },
  async updateThread ({ commit, state }, { title, text, id }) {
    const thread = findById(state.threads, id)
    const post = findById(state.posts, thread.posts[0])
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
    commit('setItem', { resource: 'threads', item: newThread })
    commit('setItem', { resource: 'posts', item: newPost })
    return docToResource(newThread)
  },
  updateUser ({ commit }, user) {
    commit('setItem', { resource: 'users', item: user })
  },
  // ---------------------------------------
  // Fetch Single Resource
  // ---------------------------------------
  fetchCategory: ({ dispatch }, { id }) => dispatch('fetchItem', { emoji: '🏷', resource: 'categories', id }),
  fetchForum: ({ dispatch }, { id }) => dispatch('fetchItem', { emoji: '🏁', resource: 'forums', id }),
  fetchThread: ({ dispatch }, { id }) => dispatch('fetchItem', { emoji: '📄', resource: 'threads', id }),
  fetchPost: ({ dispatch }, { id }) => dispatch('fetchItem', { emoji: '💬', resource: 'posts', id }),
  fetchUser: ({ dispatch }, { id }) => dispatch('fetchItem', { emoji: '🙋', resource: 'users', id }),
  fetchAuthUser: ({ dispatch, state }) => dispatch('fetchItem', { emoji: '🙋', resource: 'users', id: state.authId }),

  // ---------------------------------------
  // Fetch All of a Resource
  // ---------------------------------------
  fetchAllCategories ({ commit }) {
    console.log('🔥', '🏷', 'all')
    return new Promise((resolve) => {
      onSnapshot(query(collection(db, "categories")), (querySnapshot) => {
        const categories = querySnapshot.docs.map(doc => {
          const item = { id: doc.id, ...doc.data() }
          commit('setItem', { resource: 'categories', item })
          return item
        })
        resolve(categories)
      });
    })
  },
  // ---------------------------------------
  // Fetch Multiple Resources
  // ---------------------------------------
  fetchCategories: ({ dispatch }, { ids }) => dispatch('fetchItems', { resource: 'categories', ids, emoji: '🏷' }),
  fetchForums: ({ dispatch }, { ids }) => dispatch('fetchItems', { resource: 'forums', ids, emoji: '🏁' }),
  fetchThreads: ({ dispatch }, { ids }) => dispatch('fetchItems', { resource: 'threads', ids, emoji: '📄' }),
  fetchPosts: ({ dispatch }, { ids }) => dispatch('fetchItems', { resource: 'posts', ids, emoji: '💬' }),
  fetchUsers: ({ dispatch }, { ids }) => dispatch('fetchItems', { resource: 'users', ids, emoji: '🙋' }),

  fetchItem ({ state, commit }, { id, emoji, resource }) {
    console.log('🔥', emoji, id)
    return new Promise((resolve) => {
      onSnapshot(doc(db, resource, id), (doc) => {
        const item = { ...doc.data(), id: doc.id }
        commit('setItem', { resource, item })
        resolve(item)
      })
    })
  },
  fetchItems ({ dispatch }, { ids, resource, emoji }) {
    return Promise.all(ids.map(id => dispatch('fetchItem', { id, resource, emoji })))
  }
}
