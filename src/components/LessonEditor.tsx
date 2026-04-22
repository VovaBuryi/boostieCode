'use client';

import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Quote,
  Undo,
  Redo,
  Code,
} from 'lucide-react';
import React from 'react';

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  children: React.ReactNode;
  title: string;
}

function ToolbarButton({
  onClick,
  isActive = false,
  children,
  title,
}: ToolbarButtonProps) {
  return (
    <button
      type='button'
      onClick={onClick}
      title={title}
      className={`p-2 rounded transition ${
        isActive
          ? 'bg-indigo-100 text-indigo-600'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );
}

interface LessonEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function LessonEditor({
  content,
  onChange,
  placeholder = 'Введіть вміст уроку...',
}: LessonEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: content || '',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '');
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className='border border-gray-300 rounded-lg overflow-hidden'>
      <div className='bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-1'>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title='Жирний'
        >
          <Bold className='h-4 w-4' />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title='Курсив'
        >
          <Italic className='h-4 w-4' />
        </ToolbarButton>
        <div className='w-px h-8 bg-gray-300 mx-1' />
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          isActive={editor.isActive('heading', { level: 2 })}
          title='Заголовок 2'
        >
          <Heading2 className='h-4 w-4' />
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          isActive={editor.isActive('heading', { level: 3 })}
          title='Заголовок 3'
        >
          <span className='text-xs font-bold'>H3</span>
        </ToolbarButton>
        <div className='w-px h-8 bg-gray-300 mx-1' />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title='Маркований список'
        >
          <List className='h-4 w-4' />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title='Нумерований список'
        >
          <ListOrdered className='h-4 w-4' />
        </ToolbarButton>
        <div className='w-px h-8 bg-gray-300 mx-1' />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title='Цитата'
        >
          <Quote className='h-4 w-4' />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive('codeBlock')}
          title='Код'
        >
          <Code className='h-4 w-4' />
        </ToolbarButton>
        <div className='w-px h-8 bg-gray-300 mx-1' />
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          isActive={false}
          title='Відновити'
        >
          <Undo className='h-4 w-4' />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          isActive={false}
          title='Повторити'
        >
          <Redo className='h-4 w-4' />
        </ToolbarButton>
      </div>
      <EditorContent
        editor={editor}
        className='prose prose-sm max-w-none p-4 min-h-[200px] focus:outline-none'
      />
    </div>
  );
}
