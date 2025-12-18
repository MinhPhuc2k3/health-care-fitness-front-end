import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import './App.css'

type Role = {
  id: number
  role: string
}

type User = {
  id: number
  name: string
  email: string
  username: string
  token: string
  roles: Role[]
}

type MuscleGroup = {
  id: number
  name: string
}

type Exercise = {
  id: number
  name: string
  description: string
  category: string
  muscleGroups: MuscleGroup[]
  defaultCaloriesPerUnit: number
  unit: string
  imageUrl: string
  difficulty: string
}

type ExercisePage = {
  content: Exercise[]
  page: {
    size: number
    number: number
    totalElements: number
    totalPages: number
  }
}

type ExerciseBulkImportResponse = {
  successCount: number
  failureCount: number
  errors: string[]
}

type UserMonthlyStats = {
  month: string
  newUsers: number
  activeUsers: number
}

type ExerciseMonthlyRanking = {
  month: string
  exerciseId: number
  name: string
  image_url: string
  totalSessions: number
  rank: number
}

type RecipeMonthlyRanking = {
  month: string
  recipeId: number
  name: string
  image_url: string
  totalTimes: number
  rank: number
}

const API_BASE = 'http://localhost:8000'

function App() {
  const [username, setUsername] = useState('qa12')
  const [password, setPassword] = useState('1223456')
  const [user, setUser] = useState<User | null>(null)
  const [loadingLogin, setLoadingLogin] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  const [exercisesPage, setExercisesPage] = useState<ExercisePage | null>(null)
  const [exerciseError, setExerciseError] = useState<string | null>(null)
  const [loadingExercises, setLoadingExercises] = useState(false)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  const [activeTab, setActiveTab] = useState<'overview' | 'exercises'>(
    'exercises',
  )
  const [exerciseSubTab, setExerciseSubTab] = useState<'list' | 'import'>('list')

  const [exerciseName, setExerciseName] = useState('')

  const [muscleGroupOptions, setMuscleGroupOptions] = useState<MuscleGroup[]>([])

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<number[]>([])
  const [selectedActivityLevel, setSelectedActivityLevel] = useState<string | null>(
    null,
  )

  const [excelFile, setExcelFile] = useState<File | null>(null)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [importLoading, setImportLoading] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importResult, setImportResult] =
    useState<ExerciseBulkImportResponse | null>(null)

  const [excelRows, setExcelRows] = useState<any[]>([])
  const [excelImageRows, setExcelImageRows] = useState<
    { rowIndex: number; imageFileName: string }[]
  >([])
  const [imageMappings, setImageMappings] = useState<
    { rowIndex: number; imageFileName: string; imageFileIndex: number | null }[]
  >([])

  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editDifficulty, setEditDifficulty] = useState('')
  const [editUnit, setEditUnit] = useState('')
  const [editDefaultCaloriesPerUnit, setEditDefaultCaloriesPerUnit] =
    useState<string>('')
  const [editMuscleGroupIds, setEditMuscleGroupIds] = useState<number[]>([])
  const [editImageFile, setEditImageFile] = useState<File | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null)

  const [userMonthlyStats, setUserMonthlyStats] = useState<UserMonthlyStats[]>([])
  const [exerciseRanking, setExerciseRanking] = useState<ExerciseMonthlyRanking[]>([])
  const [recipeRanking, setRecipeRanking] = useState<RecipeMonthlyRanking[]>([])
  const [dashboardLoading, setDashboardLoading] = useState(false)
  const [dashboardError, setDashboardError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)

  const isLoggedIn = !!user?.token

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setLoadingLogin(true)
    setLoginError(null)

    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Login failed with status ${res.status}`)
      }

      const data: User = await res.json()
      setUser(data)
    } catch (err: any) {
      console.error(err)
      setLoginError(err.message ?? 'Đăng nhập thất bại')
    } finally {
      setLoadingLogin(false)
    }
  }

  const fetchExercises = async (pageNumber: number) => {
    setLoadingExercises(true)
    setExerciseError(null)

    try {
      const params = new URLSearchParams({
        page: String(pageNumber),
        size: String(pageSize),
      })

      if (exerciseName.trim()) {
        params.append('exerciseName', exerciseName.trim())
      }

      if (selectedCategory) {
        params.append('category', selectedCategory)
      }

      selectedMuscleGroups.forEach((mg) =>
        params.append('muscleGroup', String(mg)),
      )

      if (selectedActivityLevel) {
        params.append('activityLevel', selectedActivityLevel)
      }

      const res = await fetch(`${API_BASE}/api/exercises?${params.toString()}`, {
        headers: isLoggedIn
          ? {
              Authorization: `Bearer ${user?.token}`,
            }
          : undefined,
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Lấy bài tập lỗi ${res.status}`)
      }

      const data: ExercisePage = await res.json()
      setExercisesPage(data)
    } catch (err: any) {
      console.error(err)
      setExerciseError(err.message ?? 'Không lấy được danh sách bài tập')
    } finally {
      setLoadingExercises(false)
    }
  }

  const fetchDashboardData = async () => {
    if (!isLoggedIn || !user?.token) return

    setDashboardLoading(true)
    setDashboardError(null)

    try {
      const [userStatsRes, exerciseRankRes, recipeRankRes] = await Promise.all([
        fetch(`${API_BASE}/api/dashboard/users/monthly`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }),
        fetch(
          `${API_BASE}/api/dashboard/exercises/monthly?year=${selectedYear}&month=${selectedMonth}`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          },
        ),
        fetch(
          `${API_BASE}/api/dashboard/recipes/monthly?year=${selectedYear}&month=${selectedMonth}`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          },
        ),
      ])

      if (!userStatsRes.ok) {
        throw new Error(`Failed to fetch user stats: ${userStatsRes.status}`)
      }
      if (!exerciseRankRes.ok) {
        throw new Error(`Failed to fetch exercise ranking: ${exerciseRankRes.status}`)
      }
      if (!recipeRankRes.ok) {
        throw new Error(`Failed to fetch recipe ranking: ${recipeRankRes.status}`)
      }

      const userStats: UserMonthlyStats[] = await userStatsRes.json()
      const exerciseRankRaw: any[] = await exerciseRankRes.json()
      const recipeRankRaw: any[] = await recipeRankRes.json()

      // Map url -> image_url nếu backend trả về url
      const exerciseRank: ExerciseMonthlyRanking[] = exerciseRankRaw.map((item) => ({
        ...item,
        image_url: item.image_url || item.url || '',
      }))
      const recipeRank: RecipeMonthlyRanking[] = recipeRankRaw.map((item) => ({
        ...item,
        image_url: item.image_url || item.url || '',
      }))

      setUserMonthlyStats(userStats)
      setExerciseRanking(exerciseRank)
      setRecipeRanking(recipeRank)
    } catch (err: any) {
      console.error(err)
      setDashboardError(err.message ?? 'Không tải được dữ liệu dashboard')
    } finally {
      setDashboardLoading(false)
    }
  }

  useEffect(() => {
    if (isLoggedIn) {
      // load muscle groups for filters
      ;(async () => {
        try {
          const res = await fetch(`${API_BASE}/api/muscle_group`, {
            headers: isLoggedIn
              ? {
                  Authorization: `Bearer ${user?.token}`,
                }
              : undefined,
          })
          if (!res.ok) return
          const data: MuscleGroup[] = await res.json()
          setMuscleGroupOptions(data)
        } catch (err) {
          console.error(err)
        }
      })()

      fetchExercises(page)
    } else {
      setExercisesPage(null)
      setMuscleGroupOptions([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isLoggedIn,
    page,
    selectedCategory,
    selectedMuscleGroups,
    selectedActivityLevel,
    exerciseName,
    pageSize,
    exerciseSubTab,
  ])

  useEffect(() => {
    if (isLoggedIn && activeTab === 'overview') {
      fetchDashboardData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, activeTab, selectedYear, selectedMonth])

  const handleLogout = () => {
    setUser(null)
    setExercisesPage(null)
    setPage(0)
    setSelectedCategory(null)
    setSelectedMuscleGroups([])
    setSelectedActivityLevel(null)
    setActiveTab('exercises')
    setExerciseSubTab('list')
    setExcelFile(null)
    setImageFiles([])
    setImportResult(null)
    setImportError(null)
    setExcelRows([])
    setExcelImageRows([])
    setImageMappings([])
    setEditingExercise(null)
  }

  const openEditExercise = (exercise: Exercise) => {
    setEditingExercise(exercise)
    setEditName(exercise.name)
    setEditDescription(exercise.description)
    setEditCategory(exercise.category)
    setEditDifficulty(exercise.difficulty)
    setEditUnit(exercise.unit)
    setEditDefaultCaloriesPerUnit(String(exercise.defaultCaloriesPerUnit ?? ''))
    setEditMuscleGroupIds(exercise.muscleGroups.map((m) => m.id))
    setEditImageFile(null)
    setEditError(null)
  }

  const closeEditExercise = () => {
    setEditingExercise(null)
    setEditImageFile(null)
    setEditError(null)
  }

  const handleUpdateExercise = async (e: FormEvent) => {
    e.preventDefault()
    if (!editingExercise) return

    try {
      setEditLoading(true)
      setEditError(null)

      const body: any = {
        name: editName,
        description: editDescription,
        category: editCategory,
        difficulty: editDifficulty,
        unit: editUnit,
      }

      if (editDefaultCaloriesPerUnit.trim()) {
        const num = Number(editDefaultCaloriesPerUnit)
        if (!Number.isNaN(num)) {
          body.defaultCaloriesPerUnit = num
        }
      }

      if (editMuscleGroupIds.length) {
        body.muscleGroups = editMuscleGroupIds.map((id) => ({ id }))
      }

      const formData = new FormData()
      formData.append(
        'exercise',
        new Blob([JSON.stringify(body)], { type: 'application/json' }),
      )
      if (editImageFile) {
        formData.append('image', editImageFile)
      }

      const res = await fetch(
        `${API_BASE}/api/exercises/${editingExercise.id}`,
        {
          method: 'PUT',
          body: formData,
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        },
      )

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Cập nhật bài tập thất bại (${res.status})`)
      }

      const updated: Exercise = await res.json()

      setExercisesPage((prev) =>
        prev
          ? {
              ...prev,
              content: prev.content.map((ex) =>
                ex.id === updated.id ? updated : ex,
              ),
            }
          : prev,
      )

      closeEditExercise()
    } catch (err: any) {
      console.error(err)
      setEditError(err.message ?? 'Cập nhật bài tập thất bại')
    } finally {
      setEditLoading(false)
    }
  }

  const handleDeleteExercise = async (id: number) => {
    if (
      !window.confirm(
        'Bạn có chắc chắn muốn xóa bài tập này? Hành động này không thể hoàn tác.',
      )
    ) {
      return
    }

    try {
      setDeleteLoadingId(id)
      const res = await fetch(`${API_BASE}/api/exercises/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Xóa bài tập thất bại (${res.status})`)
      }

      setExercisesPage((prev) =>
        prev
          ? {
              ...prev,
              content: prev.content.filter((ex) => ex.id !== id),
              page: {
                ...prev.page,
                totalElements: prev.page.totalElements - 1,
              },
            }
          : prev,
      )
    } catch (err: any) {
      console.error(err)
      alert(err.message ?? 'Xóa bài tập thất bại')
    } finally {
      setDeleteLoadingId(null)
    }
  }

  const handleExcelChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setExcelFile(file)
    setImportError(null)
    setImportResult(null)

    if (!file) {
      setExcelRows([])
      setExcelImageRows([])
      setImageMappings([])
      return
    }

    try {
      const data = await file.arrayBuffer()
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      // @ts-ignore: xlsx is provided via runtime dependency
      const XLSX = await import('xlsx')
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const json: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })

      setExcelRows(json)

      const rows = json
        .map((row, index) => {
          const value =
            row.imageFileName ??
            row['imageFileName'] ??
            row['imagefilename'] ??
            row['ImageFileName']
          const name = String(value ?? '').trim()
          return { rowIndex: index + 2, imageFileName: name }
        })
        .filter((r) => r.imageFileName)

      setExcelImageRows(rows)
    } catch (err: any) {
      console.error(err)
      setImportError(
        'Không đọc được file Excel. Hãy kiểm tra định dạng hoặc cấu trúc cột.',
      )
      setExcelImageRows([])
      setImageMappings([])
    }
  }

  useEffect(() => {
    if (!excelImageRows.length) {
      setImageMappings([])
      return
    }

    setImageMappings((prev) =>
      excelImageRows.map((row) => {
        const existing = prev.find((m) => m.rowIndex === row.rowIndex)
        const autoIndex = imageFiles.findIndex(
          (file) => file.name.toLowerCase() === row.imageFileName.toLowerCase(),
        )

        return {
          rowIndex: row.rowIndex,
          imageFileName: row.imageFileName,
          imageFileIndex:
            existing && existing.imageFileName === row.imageFileName
              ? existing.imageFileIndex
              : autoIndex >= 0
                ? autoIndex
                : null,
        }
      }),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [excelImageRows, imageFiles])

  const handleDownloadTemplate = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/exercises/import/template`, {
        headers: isLoggedIn
          ? {
              Authorization: `Bearer ${user?.token}`,
            }
          : undefined,
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Không tải được template (${res.status})`)
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'exercise_import_template.xlsx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      console.error(err)
      alert(err.message ?? 'Không tải được template')
    }
  }

  const handleImportExercises = async (e: FormEvent) => {
    e.preventDefault()
    if (!excelFile) {
      setImportError('Vui lòng chọn file Excel.')
      return
    }

    setImportLoading(true)
    setImportError(null)
    setImportResult(null)

    try {
      if (excelImageRows.length) {
        const unmapped = imageMappings.filter(
          (m) =>
            m.imageFileName &&
            m.imageFileName.trim() &&
            m.imageFileIndex === null,
        )
        if (unmapped.length) {
          setImportError(
            'Vui lòng chọn ảnh cho tất cả các dòng có imageFileName (hoặc xóa imageFileName trong Excel).',
          )
          setImportLoading(false)
          return
        }
      }

      const formData = new FormData()
      formData.append('file', excelFile)

      const filesByName = new Map<string, File>()

      if (excelImageRows.length) {
        imageMappings.forEach((m) => {
          if (m.imageFileIndex === null) return
          const base = imageFiles[m.imageFileIndex]
          const targetName = m.imageFileName || base.name
          const normalizedName = targetName.trim()
          if (!normalizedName) return
          if (filesByName.has(normalizedName)) return

          const fileToUse =
            base.name === normalizedName
              ? base
              : new File([base], normalizedName, { type: base.type })

          filesByName.set(normalizedName, fileToUse)
        })
      } else {
        imageFiles.forEach((img) => {
          filesByName.set(img.name, img)
        })
      }

      Array.from(filesByName.values()).forEach((file) => {
        formData.append('images', file)
      })

      const res = await fetch(`${API_BASE}/api/exercises/import`, {
        method: 'POST',
        body: formData,
        headers: isLoggedIn
          ? {
              Authorization: `Bearer ${user?.token}`,
            }
          : undefined,
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Import thất bại (${res.status})`)
      }

      const data: ExerciseBulkImportResponse = await res.json()
      setImportResult(data)
      // Sau khi import thành công, reload danh sách hiện tại
      fetchExercises(page)
    } catch (err: any) {
      console.error(err)
      setImportError(err.message ?? 'Import thất bại')
    } finally {
      setImportLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Health & Fitness Admin</h1>
        {isLoggedIn && (
          <div className="user-info">
            <span>
              Xin chào, <strong>{user?.name}</strong> ({user?.username})
            </span>
            <button className="btn secondary" onClick={handleLogout}>
              Đăng xuất
            </button>
          </div>
        )}
      </header>

      <main className="app-main">
        {!isLoggedIn ? (
          <section className="card login-card">
            <h2>Đăng nhập</h2>
            <form onSubmit={handleLogin} className="form">
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập username"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Mật khẩu</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                />
              </div>

              {loginError && <p className="error-text">{loginError}</p>}

              <button className="btn primary" type="submit" disabled={loadingLogin}>
                {loadingLogin ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
            </form>
          </section>
        ) : (
          <>
            <div className="tabs">
              <button
                type="button"
                className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Tổng quan
              </button>
              <button
                type="button"
                className={`tab ${activeTab === 'exercises' ? 'active' : ''}`}
                onClick={() => setActiveTab('exercises')}
              >
                Quản lý bài tập
              </button>
            </div>

            {activeTab === 'overview' && (
              <div>
                <section className="card">
                  <div className="card-header">
                    <h2>Dashboard Analytics</h2>
                    <div className="card-header-actions">
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        style={{ marginRight: '0.5rem' }}
                      >
                        {Array.from({ length: 5 }, (_, i) => {
                          const year = new Date().getFullYear() - i
                          return (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          )
                        })}
                      </select>
                      <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                      >
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            Tháng {i + 1}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="btn outline"
                        onClick={fetchDashboardData}
                        disabled={dashboardLoading}
                      >
                        {dashboardLoading ? 'Đang tải...' : 'Tải lại'}
                      </button>
                    </div>
                  </div>

                  {dashboardError && (
                    <p className="error-text">{dashboardError}</p>
                  )}

                  {dashboardLoading && !userMonthlyStats.length && (
                    <p>Đang tải dữ liệu...</p>
                  )}

                  {!dashboardLoading && userMonthlyStats.length > 0 && (
                    <>
                      <div style={{ marginBottom: '2rem' }}>
                        <h3>Thống kê người dùng mới theo tháng</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={userMonthlyStats}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="month"
                              tickFormatter={(value: string) => {
                                const date = new Date(value)
                                return `${date.getFullYear()}-${String(
                                  date.getMonth() + 1,
                                ).padStart(2, '0')}`
                              }}
                            />
                            <YAxis />
                            <Tooltip
                              labelFormatter={(value: string) => {
                                const date = new Date(value)
                                return `${date.getFullYear()}-${String(
                                  date.getMonth() + 1,
                                ).padStart(2, '0')}`
                              }}
                            />
                            <Legend />
                            <Bar
                              dataKey="newUsers"
                              fill="#22c55e"
                              name="User mới"
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div style={{ marginBottom: '2rem' }}>
                        <h3>Xếp hạng bài tập tháng {selectedMonth}/{selectedYear}</h3>
                        {exerciseRanking.length > 0 ? (
                          <>
                            <ResponsiveContainer width="100%" height={300}>
                              <BarChart
                                data={exerciseRanking.slice(0, 10).map((item) => ({
                                  ...item,
                                  displayName: item.name || `Bài tập #${item.exerciseId}`,
                                }))}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="displayName" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar
                                  dataKey="totalSessions"
                                  fill="#3b82f6"
                                  name="Số lần tập"
                                />
                              </BarChart>
                            </ResponsiveContainer>
                            <div className="table-wrapper" style={{ marginTop: '1rem' }}>
                              <table className="table">
                                <thead>
                                  <tr>
                                    <th>Rank</th>
                                    <th>Tên bài tập</th>
                                    <th>Ảnh</th>
                                    <th>Số lần tập</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {exerciseRanking.slice(0, 10).map((item) => (
                                    <tr key={item.exerciseId}>
                                      <td>{item.rank}</td>
                                      <td>{item.name || `Bài tập #${item.exerciseId}`}</td>
                                      <td>
                                        {item.image_url && (
                                          <img
                                            src={item.image_url}
                                            alt={item.name || `Exercise ${item.exerciseId}`}
                                            className="exercise-image"
                                            style={{ width: '48px', height: '48px' }}
                                          />
                                        )}
                                      </td>
                                      <td>{item.totalSessions}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </>
                        ) : (
                          <p>Chưa có dữ liệu cho tháng này.</p>
                        )}
                      </div>

                      <div>
                        <h3>Xếp hạng món ăn tháng {selectedMonth}/{selectedYear}</h3>
                        {recipeRanking.length > 0 ? (
                          <>
                            <ResponsiveContainer width="100%" height={300}>
                              <BarChart
                                data={recipeRanking.slice(0, 10).map((item) => ({
                                  ...item,
                                  displayName: item.name || `Món ăn #${item.recipeId}`,
                                }))}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="displayName" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar
                                  dataKey="totalTimes"
                                  fill="#f59e0b"
                                  name="Số lần sử dụng"
                                />
                              </BarChart>
                            </ResponsiveContainer>
                            <div className="table-wrapper" style={{ marginTop: '1rem' }}>
                              <table className="table">
                                <thead>
                                  <tr>
                                    <th>Rank</th>
                                    <th>Tên món ăn</th>
                                    <th>Ảnh</th>
                                    <th>Số lần sử dụng</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {recipeRanking.slice(0, 10).map((item) => (
                                    <tr key={item.recipeId}>
                                      <td>{item.rank}</td>
                                      <td>{item.name || `Món ăn #${item.recipeId}`}</td>
                                      <td>
                                        {item.image_url && (
                                          <img
                                            src={item.image_url}
                                            alt={item.name || `Recipe ${item.recipeId}`}
                                            className="exercise-image"
                                            style={{ width: '48px', height: '48px' }}
                                          />
                                        )}
                                      </td>
                                      <td>{item.totalTimes}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </>
                        ) : (
                          <p>Chưa có dữ liệu cho tháng này.</p>
                        )}
                      </div>
                    </>
                  )}
                </section>
              </div>
            )}

            {activeTab === 'exercises' && (
              <>
                <div className="subtabs">
                  <button
                    type="button"
                    className={`subtab ${exerciseSubTab === 'list' ? 'active' : ''}`}
                    onClick={() => setExerciseSubTab('list')}
                  >
                    Danh sách
                  </button>
                  <button
                    type="button"
                    className={`subtab ${
                      exerciseSubTab === 'import' ? 'active' : ''
                    }`}
                    onClick={() => setExerciseSubTab('import')}
                  >
                    Import Excel
                  </button>
      </div>

                {exerciseSubTab === 'list' && !editingExercise && (
                  <section className="card">
                    <div className="card-header">
                      <h2>Danh sách bài tập</h2>
                      <div className="card-header-actions">
                        <div className="search-input">
                          <input
                            type="text"
                            placeholder="Tìm theo tên bài tập..."
                            value={exerciseName}
                            onChange={(e) => {
                              setPage(0)
                              setExerciseName(e.target.value)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                fetchExercises(0)
                              }
                            }}
                          />
                        </div>
                        <button
                          className="btn outline"
                          type="button"
                          onClick={() => fetchExercises(page)}
                          disabled={loadingExercises}
                        >
                          {loadingExercises ? 'Đang tải...' : 'Tải lại'}
        </button>
                      </div>
                    </div>

                    <div className="filters">
                      <div className="filter-group">
                        <h3>Category</h3>
                        <div className="checkbox-group">
                          {['STRENGTH', 'CARDIO', 'FLEXIBILITY'].map((cat) => (
                            <label key={cat} className="checkbox-item">
                              <input
                                type="checkbox"
                                checked={selectedCategory === cat}
                                onChange={() => {
                                  setPage(0)
                                  setSelectedCategory((prev) =>
                                    prev === cat ? null : cat,
                                  )
                                }}
                              />
                              <span>{cat}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="filter-group">
                        <h3>Muscle group</h3>
                        <div className="checkbox-group checkbox-group-scroll">
                          {muscleGroupOptions.map((mg) => (
                            <label key={mg.id} className="checkbox-item">
                              <input
                                type="checkbox"
                                checked={selectedMuscleGroups.includes(mg.id)}
                                onChange={(e) => {
                                  const checked = e.target.checked
                                  setPage(0)
                                  setSelectedMuscleGroups((prev) => {
                                    if (checked) {
                                      return Array.from(new Set([...prev, mg.id]))
                                    }
                                    return prev.filter((id) => id !== mg.id)
                                  })
                                }}
                              />
                              <span>{mg.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="filter-group">
                        <h3>Activity level</h3>
                        <div className="checkbox-group">
                          {['beginner', 'intermediate', 'advanced'].map((lv) => (
                            <label key={lv} className="checkbox-item">
                              <input
                                type="checkbox"
                                checked={selectedActivityLevel === lv}
                                onChange={() => {
                                  setPage(0)
                                  setSelectedActivityLevel((prev) =>
                                    prev === lv ? null : lv,
                                  )
                                }}
                              />
                              <span>{lv}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {exerciseError && <p className="error-text">{exerciseError}</p>}

                    {!exercisesPage && !loadingExercises && (
                      <p>
                        Chưa có dữ liệu, điều chỉnh filter hoặc nhấn
                        &quot;Tải lại&quot; để lấy danh sách.
                      </p>
                    )}

                    {exercisesPage && (
                      <>
                        <div className="table-wrapper">
                          <table className="table">
                            <thead>
                              <tr>
                                <th>ID</th>
                                <th>Tên</th>
                                <th>Category</th>
                                <th>Muscle groups</th>
                                <th>Độ khó</th>
                                <th>Ảnh</th>
                                <th>Hành động</th>
                              </tr>
                            </thead>
                            <tbody>
                              {exercisesPage.content.map((ex) => (
                                <tr key={ex.id}>
                                  <td>{ex.id}</td>
                                  <td>{ex.name}</td>
                                  <td>{ex.category}</td>
                                  <td>{ex.muscleGroups.map((m) => m.name).join(', ')}</td>
                                  <td>{ex.difficulty}</td>
                                  <td>
                                    {ex.imageUrl && (
                                      <img
                                        src={ex.imageUrl}
                                        alt={ex.name}
                                        className="exercise-image"
                                      />
                                    )}
                                  </td>
                                  <td>
                                    <div className="table-actions">
                                      <button
                                        type="button"
                                        className="btn small"
                                        onClick={() => openEditExercise(ex)}
                                      >
                                        Sửa
                                      </button>
                                      <button
                                        type="button"
                                        className="btn small danger"
                                        onClick={() => handleDeleteExercise(ex.id)}
                                        disabled={deleteLoadingId === ex.id}
                                      >
                                        {deleteLoadingId === ex.id ? 'Đang xóa...' : 'Xóa'}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="pagination">
                          <button
                            className="btn"
                            disabled={page <= 0 || loadingExercises}
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                          >
                            Trang trước
                          </button>
                          <span>
                            Trang {exercisesPage.page.number + 1} /{' '}
                            {exercisesPage.page.totalPages}
                          </span>
                          <button
                            className="btn"
                            disabled={
                              page >= exercisesPage.page.totalPages - 1 || loadingExercises
                            }
                            onClick={() =>
                              setPage((p) =>
                                Math.min(exercisesPage.page.totalPages - 1, p + 1),
                              )
                            }
                          >
                            Trang sau
                          </button>
                          <select
                            value={pageSize}
                            onChange={(e) => {
                              const newSize = Number(e.target.value) || 10
                              setPage(0)
                              setPageSize(newSize)
                              fetchExercises(0)
                            }}
                          >
                            {[5, 10, 20, 50].map((size) => (
                              <option key={size} value={size}>
                                {size} bài / trang
                              </option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}
                  </section>
                )}

                {exerciseSubTab === 'import' && (
                  <section className="card">
                    <div className="card-header">
                      <h2>Import bài tập từ Excel</h2>
                      <button
                        type="button"
                        className="btn outline"
                        onClick={handleDownloadTemplate}
                      >
                        Tải template
                      </button>
                    </div>

                    <p className="helper-text">
                      File Excel cần có các cột:{' '}
                      <code>name, description, category, difficulty, unit,
                      defaultCaloriesPerUnit, muscleGroups, imageFileName</code>.
                      Cột <code>imageFileName</code> phải trùng với tên file ảnh bạn
                      upload bên dưới.
                    </p>

                    <form className="form" onSubmit={handleImportExercises}>
                      <div className="form-group">
                        <label>File Excel</label>
                        <input
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={handleExcelChange}
                        />
                      </div>

                      <div className="form-group">
                        <label>Ảnh bài tập (nhiều file)</label>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            const files = Array.from(e.target.files ?? [])
                            setImageFiles(files)
                          }}
                        />
                        {imageFiles.length > 0 && (
                          <p className="helper-text">
                            Đã chọn {imageFiles.length} ảnh. Đảm bảo tên file trùng với
                            cột <code>imageFileName</code> trong Excel.
                          </p>
                        )}
      </div>

                      {excelRows.length > 0 && (
                        <div className="import-mapping">
                          <h3>Mapping ảnh theo imageFileName</h3>
                          <p className="helper-text">
                            Kiểm tra từng dòng <code>imageFileName</code> và chọn file
                            ảnh tương ứng. Hệ thống sẽ tự đổi tên file ảnh (nếu cần)
                            cho khớp với Excel trước khi gửi lên API.
                          </p>
                          <div className="table-wrapper">
                            <table className="table small">
                              <thead>
                                <tr>
                                  <th>Hàng</th>
                                  {Object.keys(excelRows[0] ?? {}).map((key) => (
                                    <th key={key} data-column={key.toLowerCase()}>
                                      {key}
                                    </th>
                                  ))}
                                  <th>Ảnh upload</th>
                                </tr>
                              </thead>
                              <tbody>
                                {excelRows.map((row, index) => {
                                  const rowIndex = index + 2
                                  const mapping = imageMappings.find(
                                    (m) => m.rowIndex === rowIndex,
                                  )
                                  return (
                                    <tr key={rowIndex}>
                                      <td>{rowIndex}</td>
                                      {Object.keys(excelRows[0] ?? {}).map((key) => (
                                        <td key={key} data-column={key.toLowerCase()}>
                                          {String(row[key] ?? '').toString()}
                                        </td>
                                      ))}
                                      <td>
                                        <div className="mapping-image-cell">
                                          <select
                                            value={
                                              mapping?.imageFileIndex != null
                                                ? String(mapping.imageFileIndex)
                                                : ''
                                            }
                                            onChange={(e) => {
                                              const value = e.target.value
                                              const index =
                                                value === '' ? null : Number(value)
                                              setImageMappings((prev) =>
                                                prev.map((m) =>
                                                  m.rowIndex === rowIndex
                                                    ? {
                                                        ...m,
                                                        imageFileIndex: index,
                                                      }
                                                    : m,
                                                ),
                                              )
                                            }}
                                          >
                                            <option value="">
                                              (Chưa chọn) - bỏ qua ảnh
                                            </option>
                                            {imageFiles.map((file, idx) => (
                                              <option
                                                key={file.name + idx}
                                                value={idx}
                                              >
                                                {file.name}
                                              </option>
                                            ))}
                                          </select>

                                          {mapping?.imageFileIndex != null &&
                                            imageFiles[mapping.imageFileIndex] && (
                                              <img
                                                className="mapping-image-preview"
                                                src={URL.createObjectURL(
                                                  imageFiles[mapping.imageFileIndex],
                                                )}
                                                alt={
                                                  imageFiles[mapping.imageFileIndex]
                                                    .name
                                                }
                                              />
                                            )}
                                        </div>
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {importError && <p className="error-text">{importError}</p>}

                      <button
                        className="btn primary"
                        type="submit"
                        disabled={importLoading}
                      >
                        {importLoading ? 'Đang import...' : 'Import'}
                      </button>
                    </form>

                    {importResult && (
                      <div className="import-result">
                        <p>
                          Thành công: <strong>{importResult.successCount}</strong> bài
                          tập, Thất bại:{' '}
                          <strong>{importResult.failureCount}</strong>.
                        </p>
                        {importResult.errors?.length > 0 && (
                          <ul>
                            {importResult.errors.map((err, idx) => (
                              <li key={idx}>{err}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </section>
                )}

                {exerciseSubTab === 'list' && editingExercise && (
                  <section className="card edit-card">
                    <div className="card-header">
                      <h2>Chỉnh sửa bài tập #{editingExercise.id}</h2>
                      <button
                        type="button"
                        className="btn secondary"
                        onClick={() => {
                          setEditingExercise(null)
                          setEditError(null)
                        }}
                      >
                        Quay lại
                      </button>
                    </div>
                    <form className="form" onSubmit={handleUpdateExercise}>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Tên bài tập</label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Category</label>
                          <select
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                          >
                            <option value="">-- Chọn --</option>
                            <option value="STRENGTH">STRENGTH</option>
                            <option value="CARDIO">CARDIO</option>
                            <option value="FLEXIBILITY">FLEXIBILITY</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Mô tả</label>
                        <textarea
                          rows={3}
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                        />
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Độ khó</label>
                          <select
                            value={editDifficulty}
                            onChange={(e) => setEditDifficulty(e.target.value)}
                          >
                            <option value="">-- Chọn --</option>
                            <option value="beginner">beginner</option>
                            <option value="intermediate">intermediate</option>
                            <option value="advanced">advanced</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Đơn vị</label>
                          <select
                            value={editUnit}
                            onChange={(e) => setEditUnit(e.target.value)}
                          >
                            <option value="">-- Chọn --</option>
                            <option value="REP">REP</option>
                            <option value="MINUTE">MINUTE</option>
                            <option value="SECOND">SECOND</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Calories / đơn vị</label>
                          <input
                            type="number"
                            step="0.0001"
                            value={editDefaultCaloriesPerUnit}
                            onChange={(e) =>
                              setEditDefaultCaloriesPerUnit(e.target.value)
                            }
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Muscle groups</label>
                        <div className="checkbox-group checkbox-group-scroll">
                          {muscleGroupOptions.map((mg) => (
                            <label key={mg.id} className="checkbox-item">
                              <input
                                type="checkbox"
                                checked={editMuscleGroupIds.includes(mg.id)}
                                onChange={(e) => {
                                  const checked = e.target.checked
                                  setEditMuscleGroupIds((prev) => {
                                    if (checked) {
                                      return Array.from(new Set([...prev, mg.id]))
                                    }
                                    return prev.filter((id) => id !== mg.id)
                                  })
                                }}
                              />
                              <span>{mg.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Ảnh mới (tuỳ chọn)</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0] ?? null
                            setEditImageFile(file)
                          }}
                        />
                        {editingExercise.imageUrl && !editImageFile && (
                          <p className="helper-text">
                            Ảnh hiện tại:
                            <br />
                            <img
                              src={editingExercise.imageUrl}
                              alt={editingExercise.name}
                              className="exercise-image"
                            />
                          </p>
                        )}
                      </div>

                      {editError && <p className="error-text">{editError}</p>}

                      <div className="edit-actions">
                        <button
                          type="button"
                          className="btn secondary"
                          onClick={closeEditExercise}
                          disabled={editLoading}
                        >
                          Hủy
                        </button>
                        <button
                          type="submit"
                          className="btn primary"
                          disabled={editLoading}
                        >
                          {editLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                      </div>
                    </form>
                  </section>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default App
