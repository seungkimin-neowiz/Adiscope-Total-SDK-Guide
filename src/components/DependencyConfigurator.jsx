import { useState, useEffect, useCallback, useRef } from 'react'
import './DependencyConfigurator.css'

function commentChar(language) {
  if (language === 'ruby' || language === 'yaml') return '#'
  if (language === 'json') return null
  return '//'
}

function generateCodeBlocks(platform, sdkVersionId, selectedIds, networkVersions, dslType) {
  const config = platform.codeConfig?.[sdkVersionId]
  if (!config) return []

  return config.blocks.map(block => {
    const bc = block.variants
      ? (block.variants[dslType] ?? Object.values(block.variants)[0])
      : block

    const cc = commentChar(bc.language)

    const selectedLines = platform.sections
      .flatMap(s => s.items)
      .filter(item => selectedIds.has(item.id))
      .flatMap(item => {
        const chosenId = networkVersions.get(item.id) ?? item.versions?.[0]?.id
        const ver = item.versions?.find(v => v.id === chosenId)
        const raw = ver?.[block.id]
        if (!raw) return []
        const lines = Array.isArray(raw) ? raw : (raw[dslType] ?? Object.values(raw)[0] ?? [])
        if (lines.length === 0) return []
        return cc ? [`${cc} ${item.name}`, ...lines] : lines
      })

    const coreComment = (cc && block.id !== 'repositories') ? [`${cc} core 모듈`] : []
    const allLines = [...coreComment, ...bc.coreLines, ...selectedLines]
    const body = allLines.map(l => bc.linePrefix + l).join('\n')
    const code = bc.suffix
      ? `${bc.prefix}\n${body}\n${bc.suffix}`
      : `${bc.prefix}\n${body}`

    return { id: block.id, title: bc.title, language: bc.language, code }
  })
}

export default function DependencyConfigurator({ platforms }) {
  const [platformId, setPlatformId] = useState(platforms[0].id)
  const [sdkVersionId, setSdkVersionId] = useState(platforms[0].sdkVersions[0].id)
  const [selected, setSelected] = useState(new Set())
  const [networkVersions, setNetworkVersions] = useState(new Map())
  const [dslType, setDslType] = useState(null)
  const [search, setSearch] = useState('')
  const [copiedBlock, setCopiedBlock] = useState(null)

  const platform = platforms.find(p => p.id === platformId)

  useEffect(() => {
    setSelected(new Set())
    setNetworkVersions(new Map())
    setDslType(null)
    setSearch('')
    setSdkVersionId(platform.sdkVersions[0].id)
  }, [platformId])

  const toggle = useCallback((item) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(item.id)) {
        next.delete(item.id)
      } else {
        next.add(item.id)
      }
      return next
    })
    setNetworkVersions(prev => {
      if (prev.has(item.id)) return prev
      return new Map(prev).set(item.id, item.versions[0].id)
    })
  }, [])

  const setNetworkVersion = useCallback((itemId, versionId) => {
    setNetworkVersions(prev => new Map(prev).set(itemId, versionId))
  }, [])

  const toggleSection = useCallback((section, visibleItems) => {
    const visibleIds = visibleItems.map(i => i.id)
    const allSelected = visibleIds.every(id => selected.has(id))

    setSelected(prev => {
      const next = new Set(prev)
      if (allSelected) {
        visibleIds.forEach(id => next.delete(id))
      } else {
        visibleIds.forEach(id => next.add(id))
      }
      return next
    })

    if (!allSelected) {
      setNetworkVersions(prev => {
        const next = new Map(prev)
        visibleItems.forEach(item => {
          if (!next.has(item.id)) next.set(item.id, item.versions[0].id)
        })
        return next
      })
    }
  }, [selected])

  const clearAll = useCallback(() => {
    setSelected(new Set())
    setNetworkVersions(new Map())
  }, [])

  const copyBlock = useCallback(async (block) => {
    try {
      await navigator.clipboard.writeText(block.code)
    } catch {
      const el = document.createElement('textarea')
      el.value = block.code
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopiedBlock(block.id)
    setTimeout(() => setCopiedBlock(null), 2000)
  }, [])

  const config = platform.codeConfig?.[sdkVersionId]
  const activeDslType = dslType ?? config?.dslTabs?.[0]?.id ?? null
  const codeBlocks = generateCodeBlocks(platform, sdkVersionId, selected, networkVersions, activeDslType)

  return (
    <div className="configurator">
      {/* Platform tabs */}
      <div className="platform-tabs">
        {platforms.map(p => (
          <button
            key={p.id}
            className={`platform-tab ${platformId === p.id ? 'active' : ''}`}
            onClick={() => setPlatformId(p.id)}
          >
            <PlatformIcon id={p.id} />
            <span>{p.label}</span>
          </button>
        ))}
      </div>

      {/* Version + search bar */}
      <div className="toolbar">
        <div className="toolbar-row">
          <span className="toolbar-label">SDK 버전</span>
          <SimpleDropdown
            options={platform.sdkVersions}
            value={sdkVersionId}
            onChange={setSdkVersionId}
          />
        </div>

        <div className="toolbar-row">
          <div className="search-group">
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              type="text"
              placeholder="네트워크 검색..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {selected.size > 0 && (
            <button className="clear-btn" onClick={clearAll}>
              선택 초기화 ({selected.size})
            </button>
          )}
        </div>
      </div>

      {/* Main two-column layout */}
      <div className="configurator-body">
        {/* Left: network selection */}
        <div className="network-panel">
          {platform.sections.map(section => {
            const visibleItems = section.items.filter(
              item => matchesSearch(item, search) && item.versions?.length > 0
            )
            if (visibleItems.length === 0) return null

            const visibleIds = visibleItems.map(i => i.id)
            const allChecked = visibleIds.every(id => selected.has(id))
            const someChecked = visibleIds.some(id => selected.has(id))

            return (
              <div key={section.id} className="network-section">
                <div className="section-header">
                  <h3 className="section-title">{section.label}</h3>
                  <label className="select-all-label">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      ref={el => { if (el) el.indeterminate = someChecked && !allChecked }}
                      onChange={() => toggleSection(section, visibleItems)}
                    />
                    <span>전체 선택</span>
                  </label>
                </div>

                <div className="items-grid">
                  {visibleItems.map(item => {
                    const isChecked = selected.has(item.id)
                    const chosenVerId = networkVersions.get(item.id) ?? item.versions[0].id

                    return (
                      <div
                        key={item.id}
                        className={`item-card ${isChecked ? 'selected' : ''}`}
                        onClick={() => toggle(item)}
                      >
                        <div className="item-top">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggle(item)}
                            onClick={e => e.stopPropagation()}
                          />
                          <span className="item-name">{item.name}</span>
                        </div>
                        {item.description && (
                          <span className="item-desc">{item.description}</span>
                        )}
                        <div className="item-version-row" onClick={e => e.stopPropagation()}>
                          <VersionDropdown
                            versions={item.versions}
                            value={chosenVerId}
                            onChange={verId => setNetworkVersion(item.id, verId)}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Right: generated code */}
        <div className="code-panel">
          <div className="code-panel-header">
            <span className="code-panel-title">생성된 코드</span>
            {selected.size > 0 && (
              <span className="selected-count">{selected.size}개 네트워크 선택됨</span>
            )}
          </div>

          {config?.dslTabs && (
            <div className="dsl-tabs">
              {config.dslTabs.map(tab => (
                <button
                  key={tab.id}
                  className={`dsl-tab ${activeDslType === tab.id ? 'active' : ''}`}
                  onClick={() => setDslType(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {codeBlocks.map(block => (
            <div key={block.id} className="code-block">
              <div className="code-block-header">
                <span className="code-filename">{block.title}</span>
                <button
                  className={`copy-btn ${copiedBlock === block.id ? 'copied' : ''}`}
                  onClick={() => copyBlock(block)}
                >
                  {copiedBlock === block.id ? '✓ 복사됨' : '복사'}
                </button>
              </div>
              <pre className="code-content">
                <code>{block.code}</code>
              </pre>
            </div>
          ))}

          {codeBlocks.length === 0 && (
            <div className="code-empty">
              <div className="code-empty-icon">←</div>
              <p>왼쪽에서 네트워크를 선택하면<br />의존성 코드가 여기에 표시됩니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SimpleDropdown({ options, value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const selected = options.find(o => o.id === value) ?? options[0]

  useEffect(() => {
    if (!open) return
    const handler = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="sdrop" ref={ref}>
      <button
        className="sdrop-trigger"
        onClick={() => setOpen(prev => !prev)}
      >
        <span className="sdrop-label">{selected.label}</span>
        <span className="sdrop-arrow">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="sdrop-menu">
          {options.map(opt => (
            <div
              key={opt.id}
              className={`sdrop-option ${opt.id === value ? 'active' : ''}`}
              onClick={() => { onChange(opt.id); setOpen(false) }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function matchesSearch(item, query) {
  if (!query) return true
  const q = query.toLowerCase()
  return (
    item.name.toLowerCase().includes(q) ||
    (item.description || '').toLowerCase().includes(q)
  )
}

const PLATFORM_ICONS = {
  android:     { type: 'img', src: '/android.svg' },
  ios:         { type: 'img', src: '/apple.svg' },
  unity:       { type: 'img', src: '/unity.svg' },
  flutter:     { type: 'img', src: '/flutter.svg' },
  reactnative: { type: 'emoji', char: '⚛️' },
  unreal:      { type: 'emoji', char: '🔵' },
}

function PlatformIcon({ id }) {
  const icon = PLATFORM_ICONS[id] ?? { type: 'emoji', char: '📦' }
  if (icon.type === 'img') {
    return <img src={icon.src} alt={id} className="platform-tab-icon-img" />
  }
  return <span className="platform-tab-icon">{icon.char}</span>
}

function VersionDropdown({ versions, value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const selected = versions.find(v => v.id === value) ?? versions[0]
  const isRecommended = selected.id === versions[0].id

  useEffect(() => {
    if (!open) return
    const handler = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="vdrop" ref={ref}>
      <button
        className={`vdrop-trigger ${isRecommended ? 'is-recommended' : ''}`}
        onClick={() => setOpen(prev => !prev)}
      >
        <span className="vdrop-label">{selected.label}</span>
        {isRecommended && <span className="vdrop-rec-badge">RECOMMENDED</span>}
        <span className="vdrop-arrow">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="vdrop-menu">
          {versions.map((v, i) => (
            <div
              key={v.id}
              className={`vdrop-option ${v.id === value ? 'active' : ''} ${i === 0 ? 'recommended' : ''}`}
              onClick={() => { onChange(v.id); setOpen(false) }}
            >
              <span className="vdrop-option-label">{v.label}</span>
              {i === 0 && <span className="vdrop-option-badge">RECOMMENDED</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
