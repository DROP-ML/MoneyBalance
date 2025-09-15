import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, RefreshControl, Modal } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { databaseService } from '@/services/database/storage';
import { Note, Transaction } from '@/services/database/models';

export default function NotesScreen() {
  const colorScheme = useColorScheme();
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTagFilter, setShowTagFilter] = useState(false);

  // Create note modal state
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteTags, setNewNoteTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  const loadData = async () => {
    try {
      const [allNotes, allTransactions] = await Promise.all([
        databaseService.getNotes(),
        databaseService.getTransactions()
      ]);
      
      setNotes(allNotes);
      setTransactions(allTransactions);
      
      // Extract all unique tags
      const tags = new Set<string>();
      allNotes.forEach(note => note.tags.forEach(tag => tags.add(tag)));
      allTransactions.forEach(transaction => transaction.tags.forEach(tag => tags.add(tag)));
      setAllTags(Array.from(tags).sort());
    } catch (error) {
      console.error('Error loading notes data:', error);
      Alert.alert('Error', 'Failed to load notes');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  useEffect(() => {
    applyFilters();
  }, [notes, searchQuery, selectedTags]);

  const applyFilters = () => {
    let filtered = [...notes];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query) ||
        note.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(note =>
        selectedTags.some(tag => note.tags.includes(tag))
      );
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setFilteredNotes(filtered);
  };

  const toggleTagFilter = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const addTagToNewNote = () => {
    if (newTag.trim() && !newNoteTags.includes(newTag.trim())) {
      setNewNoteTags([...newNoteTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTagFromNewNote = (tagToRemove: string) => {
    setNewNoteTags(newNoteTags.filter(tag => tag !== tagToRemove));
  };

  const createNote = async () => {
    if (!newNoteTitle.trim()) {
      Alert.alert('Title Required', 'Please enter a title for your note');
      return;
    }

    if (!newNoteContent.trim()) {
      Alert.alert('Content Required', 'Please enter some content for your note');
      return;
    }

    try {
      await databaseService.saveNote({
        title: newNoteTitle.trim(),
        content: newNoteContent.trim(),
        tags: newNoteTags,
        attachments: [],
      });

      setShowCreateModal(false);
      setNewNoteTitle('');
      setNewNoteContent('');
      setNewNoteTags([]);
      setNewTag('');
      
      await loadData();
      Alert.alert('Success', 'Note created successfully!');
    } catch (error) {
      console.error('Error creating note:', error);
      Alert.alert('Error', 'Failed to create note');
    }
  };

  const deleteNote = async (noteId: string) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await databaseService.deleteNote(noteId);
              await loadData();
              Alert.alert('Success', 'Note deleted successfully');
            } catch (error) {
              console.error('Error deleting note:', error);
              Alert.alert('Error', 'Failed to delete note');
            }
          },
        },
      ]
    );
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getLinkedTransaction = (transactionId?: string) => {
    if (!transactionId) return null;
    return transactions.find(t => t.id === transactionId);
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedText type="title">Notes</ThemedText>
        <TouchableOpacity 
          onPress={() => setShowCreateModal(true)}
          style={styles.createButton}
        >
          <IconSymbol name="plus" size={20} color={Colors[colorScheme ?? 'light'].tint} />
        </TouchableOpacity>
      </ThemedView>

      {/* Search Bar */}
      <ThemedView style={styles.searchContainer}>
        <IconSymbol name="magnifyingglass" size={20} color={Colors[colorScheme ?? 'light'].tabIconDefault} />
        <TextInput
          style={[styles.searchInput, { color: Colors[colorScheme ?? 'light'].text }]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search notes..."
          placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <IconSymbol name="xmark.circle.fill" size={20} color={Colors[colorScheme ?? 'light'].tabIconDefault} />
          </TouchableOpacity>
        )}
      </ThemedView>

      {/* Tag Filter */}
      {allTags.length > 0 && (
        <ThemedView style={styles.tagFilterContainer}>
          <TouchableOpacity 
            onPress={() => setShowTagFilter(!showTagFilter)}
            style={styles.tagFilterToggle}
          >
            <IconSymbol name="tag" size={16} color={Colors[colorScheme ?? 'light'].text} />
            <ThemedText style={styles.tagFilterText}>
              Filter by Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
            </ThemedText>
            <IconSymbol 
              name={showTagFilter ? "chevron.up" : "chevron.down"} 
              size={16} 
              color={Colors[colorScheme ?? 'light'].text} 
            />
          </TouchableOpacity>
          
          {showTagFilter && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagFilterScroll}>
              {allTags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tagFilterButton,
                    selectedTags.includes(tag) && [
                      styles.activeTagFilter,
                      { backgroundColor: Colors[colorScheme ?? 'light'].tint }
                    ],
                  ]}
                  onPress={() => toggleTagFilter(tag)}
                >
                  <ThemedText style={[
                    styles.tagFilterButtonText,
                    selectedTags.includes(tag) && styles.activeTagFilterText,
                  ]}>
                    {tag}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </ThemedView>
      )}

      {/* Results Summary */}
      <ThemedView style={styles.summaryContainer}>
        <ThemedText style={styles.summaryText}>
          {filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''}
          {searchQuery && ` matching "${searchQuery}"`}
          {selectedTags.length > 0 && ` with tags: ${selectedTags.join(', ')}`}
        </ThemedText>
      </ThemedView>

      {/* Notes List */}
      <ScrollView
        style={styles.notesList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {filteredNotes.length === 0 ? (
          <ThemedView style={styles.emptyState}>
            <IconSymbol name="note.text" size={48} color={Colors[colorScheme ?? 'light'].tabIconDefault} />
            <ThemedText style={styles.emptyStateText}>
              {searchQuery || selectedTags.length > 0 ? 'No notes found' : 'No notes yet'}
            </ThemedText>
            <ThemedText style={styles.emptyStateSubtext}>
              {searchQuery || selectedTags.length > 0
                ? 'Try adjusting your search or filters'
                : 'Create your first note to get started'
              }
            </ThemedText>
            {!searchQuery && selectedTags.length === 0 && (
              <TouchableOpacity
                style={[styles.createFirstButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
                onPress={() => setShowCreateModal(true)}
              >
                <ThemedText style={styles.createFirstButtonText}>Create Note</ThemedText>
              </TouchableOpacity>
            )}
          </ThemedView>
        ) : (
          filteredNotes.map((note) => {
            const linkedTransaction = getLinkedTransaction(note.transactionId);
            return (
              <ThemedView key={note.id} style={styles.noteItem}>
                <ThemedView style={styles.noteHeader}>
                  <ThemedText style={styles.noteTitle}>{note.title}</ThemedText>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteNote(note.id)}
                  >
                    <IconSymbol name="trash" size={16} color="#dc2626" />
                  </TouchableOpacity>
                </ThemedView>
                
                <ThemedText style={styles.noteContent}>
                  {truncateContent(note.content)}
                </ThemedText>
                
                {linkedTransaction && (
                  <ThemedView style={styles.linkedTransaction}>
                    <IconSymbol name="link" size={14} color={Colors[colorScheme ?? 'light'].tint} />
                    <ThemedText style={styles.linkedTransactionText}>
                      Linked to: {linkedTransaction.description} (${linkedTransaction.amount})
                    </ThemedText>
                  </ThemedView>
                )}
                
                {note.tags.length > 0 && (
                  <ThemedView style={styles.tagsContainer}>
                    {note.tags.map((tag, index) => (
                      <ThemedView key={index} style={styles.tag}>
                        <ThemedText style={styles.tagText}>{tag}</ThemedText>
                      </ThemedView>
                    ))}
                  </ThemedView>
                )}
                
                <ThemedText style={styles.noteDate}>
                  {formatDate(note.createdAt)}
                </ThemedText>
              </ThemedView>
            );
          })
        )}
      </ScrollView>

      {/* Create Note Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <ThemedView style={[styles.modalContainer, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
          <ThemedView style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <ThemedText style={[styles.modalButton, { color: Colors[colorScheme ?? 'light'].tint }]}>
                Cancel
              </ThemedText>
            </TouchableOpacity>
            <ThemedText type="subtitle">Create Note</ThemedText>
            <TouchableOpacity onPress={createNote}>
              <ThemedText style={[styles.modalButton, { color: Colors[colorScheme ?? 'light'].tint }]}>
                Save
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>

          <ScrollView style={styles.modalContent}>
            <ThemedView style={styles.inputSection}>
              <ThemedText style={styles.inputLabel}>Title</ThemedText>
              <TextInput
                style={[styles.titleInput, { 
                  color: Colors[colorScheme ?? 'light'].text,
                  backgroundColor: Colors[colorScheme ?? 'light'].background,
                  borderColor: Colors[colorScheme ?? 'light'].tabIconDefault,
                }]}
                value={newNoteTitle}
                onChangeText={setNewNoteTitle}
                placeholder="Enter note title..."
                placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
              />
            </ThemedView>

            <ThemedView style={styles.inputSection}>
              <ThemedText style={styles.inputLabel}>Content</ThemedText>
              <TextInput
                style={[styles.contentInput, { 
                  color: Colors[colorScheme ?? 'light'].text,
                  backgroundColor: Colors[colorScheme ?? 'light'].background,
                  borderColor: Colors[colorScheme ?? 'light'].tabIconDefault,
                }]}
                value={newNoteContent}
                onChangeText={setNewNoteContent}
                placeholder="Write your note here..."
                placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
                multiline={true}
                numberOfLines={8}
                textAlignVertical="top"
              />
            </ThemedView>

            <ThemedView style={styles.inputSection}>
              <ThemedText style={styles.inputLabel}>Tags</ThemedText>
              <ThemedView style={styles.tagInputContainer}>
                <TextInput
                  style={[styles.tagInput, { 
                    color: Colors[colorScheme ?? 'light'].text,
                    backgroundColor: Colors[colorScheme ?? 'light'].background,
                    borderColor: Colors[colorScheme ?? 'light'].tabIconDefault,
                  }]}
                  value={newTag}
                  onChangeText={setNewTag}
                  placeholder="Add tag..."
                  placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
                  onSubmitEditing={addTagToNewNote}
                />
                <TouchableOpacity style={styles.addTagButton} onPress={addTagToNewNote}>
                  <IconSymbol name="plus" size={16} color="#fff" />
                </TouchableOpacity>
              </ThemedView>
              
              {newNoteTags.length > 0 && (
                <ThemedView style={styles.newNoteTagsContainer}>
                  {newNoteTags.map((tag, index) => (
                    <ThemedView key={index} style={styles.newNoteTag}>
                      <ThemedText style={styles.newNoteTagText}>{tag}</ThemedText>
                      <TouchableOpacity onPress={() => removeTagFromNewNote(tag)}>
                        <IconSymbol name="xmark" size={12} color="#666" />
                      </TouchableOpacity>
                    </ThemedView>
                  ))}
                </ThemedView>
              )}
            </ThemedView>
          </ScrollView>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  createButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    marginTop: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  tagFilterContainer: {
    margin: 20,
    marginTop: 0,
  },
  tagFilterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  tagFilterText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  tagFilterScroll: {
    marginTop: 8,
  },
  tagFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  activeTagFilter: {
    backgroundColor: '#2563eb',
  },
  tagFilterButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  activeTagFilterText: {
    color: '#fff',
  },
  summaryContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  summaryText: {
    fontSize: 14,
    opacity: 0.6,
  },
  notesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  noteItem: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  deleteButton: {
    padding: 4,
  },
  noteContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    opacity: 0.8,
  },
  linkedTransaction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  linkedTransactionText: {
    fontSize: 12,
    opacity: 0.7,
    fontStyle: 'italic',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  tag: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '500',
  },
  noteDate: {
    fontSize: 12,
    opacity: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 4,
    textAlign: 'center',
    marginBottom: 20,
  },
  createFirstButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  titleInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  contentInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    height: 120,
  },
  tagInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  addTagButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newNoteTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  newNoteTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  newNoteTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
