import DependencyConfigurator from './components/DependencyConfigurator'
import { platforms } from './data/index'
import './App.css'

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-logo">
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Adiscope" className="app-logo-img" />
          </div>
          <div className="app-title-block">
            <h1 className="app-title">Help Center</h1>
            <p className="app-subtitle">
              Adiscope SDK 통합 가이드 및 기술 문서를 제공합니다.
            </p>
          </div>
        </div>
      </header>
      <main className="app-main">
        <div className="page-content">
          <h2 className="content-title">네트워크 구성</h2>
          <div className="content-desc">
            <p>애플리케이션에서 사용되는 광고 유형과 포함하고자 하는 광고 네트워크를 선택하고, <b>Adiscope SDK Full Package</b>를 사용하는 경우 모든 서비스를 선택합니다.</p>
            <p>요구 사항에 따라 광고 네트워크나 서비스 어댑터를 추가하거나 제거할 수 있습니다.</p>
            <p><b>SDK를 미디에이션 도구로만</b> 사용하려면 빌드에서 서비스를 <b>제외</b>할 수 있습니다.</p>
          </div>
        </div>
        <DependencyConfigurator platforms={platforms} />
      </main>
    </div>
  )
}
