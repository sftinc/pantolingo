/**
 * Tests for empty paired tags treated as void elements
 * Verifies that empty tags like FA icons become [HV1] instead of [HE1][/HE1]
 * Also tests whitespace-only tags becoming void with whitespace extracted
 */

import { describe, it, expect } from 'vitest'
import { htmlToPlaceholders, placeholdersToHtml } from './placeholders.js'

describe('htmlToPlaceholders', () => {
  describe('truly empty tags → void', () => {
    it('converts Font Awesome icon (empty <i>) to void placeholder', () => {
      const { text, replacements } = htmlToPlaceholders('Click the <i class="fas fa-user"></i> icon.')
      expect(text).toBe('Click the [HV1] icon.')
      expect(replacements).toHaveLength(1)
    })

    it('keeps normal italic with text as paired placeholder', () => {
      const { text, replacements } = htmlToPlaceholders('This is <i>important</i> text.')
      expect(text).toBe('This is [HE1]important[/HE1] text.')
      expect(replacements).toHaveLength(1)
    })

    it('handles mixed FA icon and text formatting', () => {
      const { text, replacements } = htmlToPlaceholders('Click <i class="fas fa-save"></i> to <i>save</i> work.')
      expect(text).toBe('Click [HV1] to [HE1]save[/HE1] work.')
      expect(replacements).toHaveLength(2)
    })

    it('converts empty span to void placeholder', () => {
      const { text, replacements } = htmlToPlaceholders('Text<span class="spacer"></span>more.')
      expect(text).toBe('Text[HV1]more.')
      expect(replacements).toHaveLength(1)
    })

    it('handles nested icon inside link', () => {
      const { text, replacements } = htmlToPlaceholders('<a href="/profile"><i class="fa fa-user"></i> Profile</a>')
      expect(text).toBe('[HA1][HV1] Profile[/HA1]')
      expect(replacements).toHaveLength(2)
    })

    it('handles multiple FA icons', () => {
      const { text, replacements } = htmlToPlaceholders('<i class="far fa-edit"></i> Edit <i class="fas fa-trash"></i> Delete')
      expect(text).toBe('[HV1] Edit [HV2] Delete')
      expect(replacements).toHaveLength(2)
    })

    it('handles v6 FA classes', () => {
      const { text, replacements } = htmlToPlaceholders('Icon <i class="fa-solid fa-check"></i> here.')
      expect(text).toBe('Icon [HV1] here.')
      expect(replacements).toHaveLength(1)
    })
  })

  describe('whitespace-only tags → void with whitespace extracted', () => {
    it('converts single space inside tag to void + space after', () => {
      const { text, replacements } = htmlToPlaceholders('Before<i class="fa fa-icon"> </i>after.')
      expect(text).toBe('Before[HV1] after.')
      expect(replacements).toHaveLength(1)
    })

    it('normalizes multiple spaces inside tag to single space', () => {
      const { text, replacements } = htmlToPlaceholders('Before<i class="fa">   </i>after.')
      expect(text).toBe('Before[HV1] after.')
      expect(replacements).toHaveLength(1)
    })

    it('normalizes tab inside tag to space', () => {
      const { text, replacements } = htmlToPlaceholders('Before<span class="x">\t</span>after.')
      expect(text).toBe('Before[HV1] after.')
      expect(replacements).toHaveLength(1)
    })

    it('normalizes newline inside tag to space', () => {
      const { text, replacements } = htmlToPlaceholders('Before<span class="x">\n</span>after.')
      expect(text).toBe('Before[HV1] after.')
      expect(replacements).toHaveLength(1)
    })

    it('handles nested whitespace-only icon in link', () => {
      const { text, replacements } = htmlToPlaceholders('<a href="/user"><i class="fa fa-user"> </i>Profile</a>')
      expect(text).toBe('[HA1][HV1] Profile[/HA1]')
      expect(replacements).toHaveLength(2)
    })

    it('handles mixed empty and whitespace-only tags', () => {
      const { text, replacements } = htmlToPlaceholders('<i class="fa-edit"></i> Edit <i class="fa-save"> </i>Save')
      expect(text).toBe('[HV1] Edit [HV2] Save')
      expect(replacements).toHaveLength(2)
    })

    it('keeps real content unaffected', () => {
      const { text, replacements } = htmlToPlaceholders('Click <i class="emphasis">here</i> now.')
      expect(text).toBe('Click [HE1]here[/HE1] now.')
      expect(replacements).toHaveLength(1)
    })
  })
})

describe('placeholdersToHtml round-trip', () => {
  it('restores empty tag correctly', () => {
    const input = 'Click the <i class="fas fa-user"></i> icon.'
    const { text, replacements } = htmlToPlaceholders(input)
    const restored = placeholdersToHtml(text, replacements)
    expect(restored).toBe(input)
  })

  it('restores whitespace-only tag with space moved outside', () => {
    const input = 'Before<i class="fa fa-icon"> </i>after.'
    const { text, replacements } = htmlToPlaceholders(input)
    const restored = placeholdersToHtml(text, replacements)
    // Space is moved outside the tag
    expect(restored.replace(/\s+/g, ' ').trim()).toBe('Before<i class="fa fa-icon"></i> after.'.replace(/\s+/g, ' ').trim())
  })

  it('restores multiple spaces normalized to single space outside', () => {
    const input = 'Before<i class="fa">   </i>after.'
    const { text, replacements } = htmlToPlaceholders(input)
    const restored = placeholdersToHtml(text, replacements)
    expect(restored.replace(/\s+/g, ' ').trim()).toBe('Before<i class="fa"></i> after.'.replace(/\s+/g, ' ').trim())
  })

  it('restores tab normalized to space outside', () => {
    const input = 'Before<span class="x">\t</span>after.'
    const { text, replacements } = htmlToPlaceholders(input)
    const restored = placeholdersToHtml(text, replacements)
    expect(restored.replace(/\s+/g, ' ').trim()).toBe('Before<span class="x"></span> after.'.replace(/\s+/g, ' ').trim())
  })

  it('restores newline normalized to space outside', () => {
    const input = 'Before<span class="x">\n</span>after.'
    const { text, replacements } = htmlToPlaceholders(input)
    const restored = placeholdersToHtml(text, replacements)
    expect(restored.replace(/\s+/g, ' ').trim()).toBe('Before<span class="x"></span> after.'.replace(/\s+/g, ' ').trim())
  })

  it('restores nested whitespace-only icon in link', () => {
    const input = '<a href="/user"><i class="fa fa-user"> </i>Profile</a>'
    const { text, replacements } = htmlToPlaceholders(input)
    const restored = placeholdersToHtml(text, replacements)
    expect(restored.replace(/\s+/g, ' ').trim()).toBe('<a href="/user"><i class="fa fa-user"></i> Profile</a>'.replace(/\s+/g, ' ').trim())
  })

  it('restores mixed empty and whitespace-only tags', () => {
    const input = '<i class="fa-edit"></i> Edit <i class="fa-save"> </i>Save'
    const { text, replacements } = htmlToPlaceholders(input)
    const restored = placeholdersToHtml(text, replacements)
    expect(restored.replace(/\s+/g, ' ').trim()).toBe('<i class="fa-edit"></i> Edit <i class="fa-save"></i> Save'.replace(/\s+/g, ' ').trim())
  })

  it('restores real content unchanged', () => {
    const input = 'Click <i class="emphasis">here</i> now.'
    const { text, replacements } = htmlToPlaceholders(input)
    const restored = placeholdersToHtml(text, replacements)
    expect(restored).toBe(input)
  })
})
