# Adiscope Total SDK Guide

Adiscope SDK 통합 가이드 페이지입니다. 플랫폼과 광고 네트워크를 선택하면 필요한 의존성 코드가 자동으로 생성됩니다.

**[→ 가이드 페이지 바로가기](https://seungkimin-neowiz.github.io/Adiscope-Total-SDK-Guide/)**

## 주요 기능

- **플랫폼별 지원**: Android, iOS, Unity, Flutter
- **버전별 의존성**: SDK 버전에 따른 올바른 의존성 코드 자동 생성
- **네트워크 선택**: 필요한 광고 네트워크만 체크박스로 선택
- **코드 복사**: 생성된 의존성 코드를 원클릭으로 클립보드에 복사
- **검색 필터**: 네트워크 이름으로 빠른 검색

## 기술 스택

- **Framework**: React 18 + Vite 5
- **Data**: JSON 기반 의존성 관리 (`src/data/`)
- **배포**: GitHub Actions → GitHub Pages

## 로컬 개발

```bash
# 의존성 설치
npm install

# 개발 서버 시작 (http://localhost:5173)
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

## GitHub Pages 배포

### 1. GitHub Repository Settings 설정

1. GitHub 저장소 → **Settings** → **Pages**
2. **Source**: `GitHub Actions` 선택

### 2. 자동 배포

`main` 브랜치에 push하면 GitHub Actions가 자동으로 빌드 및 배포합니다.

배포 URL: `https://[username].github.io/Adiscope-Total-SDK-Guide/`

### 3. 수동 배포

GitHub 저장소 → **Actions** → **Deploy to GitHub Pages** → **Run workflow**

## 데이터 관리

광고 네트워크 및 의존성 정보는 `src/data/` 폴더의 JSON 파일로 관리합니다.

```
src/data/
├── android.json      # Android Gradle 의존성
├── ios.json          # iOS CocoaPods 의존성
├── unity.json        # Unity Package Manager 의존성
├── flutter.json      # Flutter pubspec.yaml 의존성
├── reactnative.json  # React Native package.json 의존성
├── unreal.json       # Unreal Engine Build.cs 의존성
└── index.js          # 데이터 export
```

### 네트워크 추가 방법

각 플랫폼 JSON 파일의 `sections[].items` 배열에 항목을 추가합니다.

```json
{
  "id": "new_network",
  "name": "New Network",
  "description": "New Ad Network",
  "versions": {
    "3.x": {
      "dependencies": ["implementation 'com.naver.ads:adiscope-mediation-newnetwork:3.1.0'"]
    }
  }
}
```

### SDK 버전 추가 방법

1. `sdkVersions` 배열에 버전 추가
2. `codeConfig` 객체에 해당 버전의 코드 블록 설정 추가
3. 각 네트워크 item의 `versions` 객체에 새 버전 데이터 추가

## 라이선스

COPYRIGHT 2013. ALL RIGHTS RESERVED BY TNK FACTORY
