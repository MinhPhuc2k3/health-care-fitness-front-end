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

type Ingredient = {
  id: number
  name: string
  description: string
  calories: number
  protein: number
  carbs: number
  fat: number
  imageUrl?: string
}

type IngredientPage = {
  content: Ingredient[]
  page: {
    size: number
    number: number
    totalElements: number
    totalPages: number
  }
}

type IngredientImportResponse = {
  success: boolean
  message: string
  totalImported?: number
  totalImages?: number
  data?: Ingredient[]
  errors?: string
}

type RecipeIngredient = {
  ingredient: {
    id: number
    name?: string
  }
  quantity: number
}

type Recipe = {
  id: number
  name: string
  description: string
  calories: number
  protein: number
  carbs: number
  fat: number
  type: string
  imageUrl?: string
  recipeIngredients?: RecipeIngredient[]
}

type RecipePage = {
  content: Recipe[]
  page: {
    size: number
    number: number
    totalElements: number
    totalPages: number
  }
}

type PlanSession = {
  id: number
  sessionDayOfWeek: string
  targetCalories: number
  category: string
  muscleGroups?: MuscleGroup[]
}

type Plan = {
  id: number
  name: string
  goal?: {
    id: number
    name?: string
  }
  planSessions?: PlanSession[]
}

const API_BASE = 'http://localhost:8000'

// Translation functions
const translateCategory = (category: string): string => {
  const translations: Record<string, string> = {
    STRENGTH: 'Kháng lực',
    CARDIO: 'Cardio',
    FLEXIBILITY: 'Linh hoạt',
  }
  return translations[category] || category
}

const translateActivityLevel = (level: string): string => {
  const translations: Record<string, string> = {
    beginner: 'Cơ bản',
    intermediate: 'Trung bình',
    advanced: 'Nâng cao',
  }
  return translations[level] || level
}

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

  const [activeTab, setActiveTab] = useState<
    'overview' | 'exercises' | 'foods' | 'plans'
  >('exercises')
  const [exerciseSubTab, setExerciseSubTab] = useState<'list' | 'import'>('list')
  const [foodSubTab, setFoodSubTab] = useState<'ingredients' | 'recipes'>('ingredients')

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

  // Ingredient states
  const [ingredientsPage, setIngredientsPage] = useState<IngredientPage | null>(null)
  const [ingredientError, setIngredientError] = useState<string | null>(null)
  const [loadingIngredients, setLoadingIngredients] = useState(false)
  const [ingredientPage, setIngredientPage] = useState(0)
  const [ingredientPageSize, setIngredientPageSize] = useState(10)
  const [ingredientSort, setIngredientSort] = useState('name,asc')
  const [ingredientName, setIngredientName] = useState('')

  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null)
  const [editIngredientName, setEditIngredientName] = useState('')
  const [editIngredientDescription, setEditIngredientDescription] = useState('')
  const [editIngredientCalories, setEditIngredientCalories] = useState<string>('')
  const [editIngredientProtein, setEditIngredientProtein] = useState<string>('')
  const [editIngredientCarbs, setEditIngredientCarbs] = useState<string>('')
  const [editIngredientFat, setEditIngredientFat] = useState<string>('')
  const [editIngredientImageFile, setEditIngredientImageFile] = useState<File | null>(null)
  const [editIngredientLoading, setEditIngredientLoading] = useState(false)
  const [editIngredientError, setEditIngredientError] = useState<string | null>(null)

  const [creatingIngredient, setCreatingIngredient] = useState(false)
  const [createIngredientName, setCreateIngredientName] = useState('')
  const [createIngredientDescription, setCreateIngredientDescription] = useState('')
  const [createIngredientCalories, setCreateIngredientCalories] = useState<string>('')
  const [createIngredientProtein, setCreateIngredientProtein] = useState<string>('')
  const [createIngredientCarbs, setCreateIngredientCarbs] = useState<string>('')
  const [createIngredientFat, setCreateIngredientFat] = useState<string>('')
  const [createIngredientImageFile, setCreateIngredientImageFile] = useState<File | null>(null)
  const [createIngredientLoading, setCreateIngredientLoading] = useState(false)
  const [createIngredientError, setCreateIngredientError] = useState<string | null>(null)

  const [deleteIngredientLoadingId, setDeleteIngredientLoadingId] = useState<number | null>(null)

  const [ingredientExcelFile, setIngredientExcelFile] = useState<File | null>(null)
  const [ingredientImageFiles, setIngredientImageFiles] = useState<File[]>([])
  const [ingredientImportLoading, setIngredientImportLoading] = useState(false)
  const [ingredientImportError, setIngredientImportError] = useState<string | null>(null)
  const [ingredientImportResult, setIngredientImportResult] =
    useState<IngredientImportResponse | null>(null)

  // Recipe states
  const [recipesPage, setRecipesPage] = useState<RecipePage | null>(null)
  const [recipeError, setRecipeError] = useState<string | null>(null)
  const [loadingRecipes, setLoadingRecipes] = useState(false)
  const [recipePage, setRecipePage] = useState(0)
  const [recipePageSize, setRecipePageSize] = useState(10)
  const [recipeName, setRecipeName] = useState('')

  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null)
  const [editRecipeName, setEditRecipeName] = useState('')
  const [editRecipeDescription, setEditRecipeDescription] = useState('')
  const [editRecipeCalories, setEditRecipeCalories] = useState<string>('')
  const [editRecipeProtein, setEditRecipeProtein] = useState<string>('')
  const [editRecipeCarbs, setEditRecipeCarbs] = useState<string>('')
  const [editRecipeFat, setEditRecipeFat] = useState<string>('')
  const [editRecipeType, setEditRecipeType] = useState('')
  const [editRecipeIngredients, setEditRecipeIngredients] = useState<
    { ingredientId: number; quantity: string }[]
  >([])
  const [editRecipeImageFile, setEditRecipeImageFile] = useState<File | null>(null)
  const [editRecipeLoading, setEditRecipeLoading] = useState(false)
  const [editRecipeError, setEditRecipeError] = useState<string | null>(null)

  const [creatingRecipe, setCreatingRecipe] = useState(false)
  const [createRecipeName, setCreateRecipeName] = useState('')
  const [createRecipeDescription, setCreateRecipeDescription] = useState('')
  const [createRecipeCalories, setCreateRecipeCalories] = useState<string>('')
  const [createRecipeProtein, setCreateRecipeProtein] = useState<string>('')
  const [createRecipeCarbs, setCreateRecipeCarbs] = useState<string>('')
  const [createRecipeFat, setCreateRecipeFat] = useState<string>('')
  const [createRecipeType, setCreateRecipeType] = useState('')
  const [createRecipeIngredients, setCreateRecipeIngredients] = useState<
    { ingredientId: number; quantity: string }[]
  >([])
  const [createRecipeImageFile, setCreateRecipeImageFile] = useState<File | null>(null)
  const [createRecipeLoading, setCreateRecipeLoading] = useState(false)
  const [createRecipeError, setCreateRecipeError] = useState<string | null>(null)

  const [deleteRecipeLoadingId, setDeleteRecipeLoadingId] = useState<number | null>(null)
  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([])

  // Plan states
  const [plans, setPlans] = useState<Plan[]>([])
  const [planError, setPlanError] = useState<string | null>(null)
  const [loadingPlans, setLoadingPlans] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [planSessions, setPlanSessions] = useState<PlanSession[]>([])
  const [loadingPlanSessions, setLoadingPlanSessions] = useState(false)

  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [editPlanName, setEditPlanName] = useState('')
  const [editPlanGoalId, setEditPlanGoalId] = useState<number | null>(null)
  const [editPlanSessions, setEditPlanSessions] = useState<
    {
      id?: number
      sessionDayOfWeek: string
      targetCalories: string
      category: string
      muscleGroupIds: number[]
    }[]
  >([])
  const [editPlanLoading, setEditPlanLoading] = useState(false)
  const [editPlanError, setEditPlanError] = useState<string | null>(null)

  const [creatingPlan, setCreatingPlan] = useState(false)
  const [createPlanName, setCreatePlanName] = useState('')
  const [createPlanGoalId, setCreatePlanGoalId] = useState<number | null>(null)
  const [createPlanLoading, setCreatePlanLoading] = useState(false)
  const [createPlanError, setCreatePlanError] = useState<string | null>(null)

  const [deletePlanLoadingId, setDeletePlanLoadingId] = useState<number | null>(null)
  const [availableGoals, setAvailableGoals] = useState<{ id: number; name: string }[]>([])
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null)

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

      if (activeTab === 'exercises') {
        fetchExercises(page)
      }
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
    pageSize,
    exerciseSubTab,
    activeTab,
  ])

  useEffect(() => {
    if (isLoggedIn && activeTab === 'foods') {
      if (foodSubTab === 'ingredients') {
        fetchIngredients(ingredientPage)
      } else if (foodSubTab === 'recipes') {
        fetchRecipes(recipePage)
        fetchAvailableIngredients()
      }
    } else {
      if (activeTab !== 'foods') {
        setIngredientsPage(null)
        setRecipesPage(null)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isLoggedIn,
    activeTab,
    foodSubTab,
    ingredientPage,
    ingredientPageSize,
    ingredientSort,
    recipePage,
    recipePageSize,
  ])

  // Debounce search for exercises
  useEffect(() => {
    if (!isLoggedIn || activeTab !== 'exercises') return

    const timeoutId = setTimeout(() => {
      setPage(0)
      fetchExercises(0)
    }, 500)

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseName, isLoggedIn, activeTab])

  // Debounce search for ingredients
  useEffect(() => {
    if (!isLoggedIn || activeTab !== 'foods' || foodSubTab !== 'ingredients') return

    const timeoutId = setTimeout(() => {
      setIngredientPage(0)
      fetchIngredients(0)
    }, 500)

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ingredientName, isLoggedIn, activeTab, foodSubTab])

  // Debounce search for recipes
  useEffect(() => {
    if (!isLoggedIn || activeTab !== 'foods' || foodSubTab !== 'recipes') return

    const timeoutId = setTimeout(() => {
      setRecipePage(0)
      fetchRecipes(0)
    }, 500)

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipeName, isLoggedIn, activeTab, foodSubTab])

  useEffect(() => {
    if (isLoggedIn && activeTab === 'overview') {
      fetchDashboardData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, activeTab, selectedYear, selectedMonth])

  useEffect(() => {
    if (isLoggedIn && activeTab === 'plans') {
      fetchAvailableGoals()
      // Load muscle groups for plan sessions
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
      if (selectedGoalId !== null) {
        fetchPlans(selectedGoalId)
      }
    } else {
      setPlans([])
      setSelectedPlan(null)
      setPlanSessions([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, activeTab, selectedGoalId])

  const fetchIngredients = async (pageNumber: number) => {
    setLoadingIngredients(true)
    setIngredientError(null)

    try {
      const params = new URLSearchParams({
        page: String(pageNumber),
        size: String(ingredientPageSize),
        sort: ingredientSort,
      })

      if (ingredientName.trim()) {
        params.append('search', ingredientName.trim())
      }

      const res = await fetch(`${API_BASE}/api/ingredients?${params.toString()}`, {
        headers: isLoggedIn
          ? {
              Authorization: `Bearer ${user?.token}`,
            }
          : undefined,
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Lấy nguyên liệu lỗi ${res.status}`)
      }

      const data: IngredientPage = await res.json()
      setIngredientsPage(data)
    } catch (err: any) {
      console.error(err)
      setIngredientError(err.message ?? 'Không lấy được danh sách nguyên liệu')
    } finally {
      setLoadingIngredients(false)
    }
  }

  const handleCreateIngredient = async (e: FormEvent) => {
    e.preventDefault()
    if (!createIngredientName.trim()) {
      setCreateIngredientError('Tên nguyên liệu là bắt buộc')
      return
    }

    try {
      setCreateIngredientLoading(true)
      setCreateIngredientError(null)

      const formData = new FormData()
      formData.append('name', createIngredientName.trim())
      if (createIngredientDescription.trim()) {
        formData.append('description', createIngredientDescription.trim())
      }
      if (createIngredientCalories.trim()) {
        const calories = Number(createIngredientCalories)
        if (!Number.isNaN(calories) && calories >= 0) {
          formData.append('calories', String(calories))
        }
      }
      if (createIngredientProtein.trim()) {
        const protein = Number(createIngredientProtein)
        if (!Number.isNaN(protein) && protein >= 0) {
          formData.append('protein', String(protein))
        }
      }
      if (createIngredientCarbs.trim()) {
        const carbs = Number(createIngredientCarbs)
        if (!Number.isNaN(carbs) && carbs >= 0) {
          formData.append('carbs', String(carbs))
        }
      }
      if (createIngredientFat.trim()) {
        const fat = Number(createIngredientFat)
        if (!Number.isNaN(fat) && fat >= 0) {
          formData.append('fat', String(fat))
        }
      }
      if (createIngredientImageFile) {
        formData.append('image', createIngredientImageFile)
      }

      const res = await fetch(`${API_BASE}/api/ingredients`, {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Tạo nguyên liệu thất bại (${res.status})`)
      }

      const created: Ingredient = await res.json()
      setIngredientsPage((prev) =>
        prev
          ? {
              ...prev,
              content: [created, ...prev.content],
              page: {
                ...prev.page,
                totalElements: prev.page.totalElements + 1,
              },
            }
          : prev,
      )

      // Reset form
      setCreateIngredientName('')
      setCreateIngredientDescription('')
      setCreateIngredientCalories('')
      setCreateIngredientProtein('')
      setCreateIngredientCarbs('')
      setCreateIngredientFat('')
      setCreateIngredientImageFile(null)
      setCreatingIngredient(false)
    } catch (err: any) {
      console.error(err)
      setCreateIngredientError(err.message ?? 'Tạo nguyên liệu thất bại')
    } finally {
      setCreateIngredientLoading(false)
    }
  }

  const openEditIngredient = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient)
    setEditIngredientName(ingredient.name)
    setEditIngredientDescription(ingredient.description || '')
    setEditIngredientCalories(String(ingredient.calories ?? ''))
    setEditIngredientProtein(String(ingredient.protein ?? ''))
    setEditIngredientCarbs(String(ingredient.carbs ?? ''))
    setEditIngredientFat(String(ingredient.fat ?? ''))
    setEditIngredientImageFile(null)
    setEditIngredientError(null)
  }

  const closeEditIngredient = () => {
    setEditingIngredient(null)
    setEditIngredientImageFile(null)
    setEditIngredientError(null)
  }

  const handleUpdateIngredient = async (e: FormEvent) => {
    e.preventDefault()
    if (!editingIngredient) return

    try {
      setEditIngredientLoading(true)
      setEditIngredientError(null)

      const formData = new FormData()
      formData.append('name', editIngredientName.trim())
      if (editIngredientDescription.trim()) {
        formData.append('description', editIngredientDescription.trim())
      }
      if (editIngredientCalories.trim()) {
        const calories = Number(editIngredientCalories)
        if (!Number.isNaN(calories) && calories >= 0) {
          formData.append('calories', String(calories))
        }
      }
      if (editIngredientProtein.trim()) {
        const protein = Number(editIngredientProtein)
        if (!Number.isNaN(protein) && protein >= 0) {
          formData.append('protein', String(protein))
        }
      }
      if (editIngredientCarbs.trim()) {
        const carbs = Number(editIngredientCarbs)
        if (!Number.isNaN(carbs) && carbs >= 0) {
          formData.append('carbs', String(carbs))
        }
      }
      if (editIngredientFat.trim()) {
        const fat = Number(editIngredientFat)
        if (!Number.isNaN(fat) && fat >= 0) {
          formData.append('fat', String(fat))
        }
      }
      if (editIngredientImageFile) {
        formData.append('image', editIngredientImageFile)
      }

      const res = await fetch(
        `${API_BASE}/api/ingredients/${editingIngredient.id}`,
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
        throw new Error(text || `Cập nhật nguyên liệu thất bại (${res.status})`)
      }

      const updated: Ingredient = await res.json()

      setIngredientsPage((prev) =>
        prev
          ? {
              ...prev,
              content: prev.content.map((ing) =>
                ing.id === updated.id ? updated : ing,
              ),
            }
          : prev,
      )

      closeEditIngredient()
    } catch (err: any) {
      console.error(err)
      setEditIngredientError(err.message ?? 'Cập nhật nguyên liệu thất bại')
    } finally {
      setEditIngredientLoading(false)
    }
  }

  const handleDeleteIngredient = async (id: number) => {
    if (
      !window.confirm(
        'Bạn có chắc chắn muốn xóa nguyên liệu này? Hành động này không thể hoàn tác.',
      )
    ) {
      return
    }

    try {
      setDeleteIngredientLoadingId(id)
      const res = await fetch(`${API_BASE}/api/ingredients/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Xóa nguyên liệu thất bại (${res.status})`)
      }

      setIngredientsPage((prev) =>
        prev
          ? {
              ...prev,
              content: prev.content.filter((ing) => ing.id !== id),
              page: {
                ...prev.page,
                totalElements: prev.page.totalElements - 1,
              },
            }
          : prev,
      )
    } catch (err: any) {
      console.error(err)
      alert(err.message ?? 'Xóa nguyên liệu thất bại')
    } finally {
      setDeleteIngredientLoadingId(null)
    }
  }

  const handleDownloadIngredientTemplate = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/ingredients/excel/template`, {
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
      a.download = 'ingredient_import_template.xlsx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      console.error(err)
      alert(err.message ?? 'Không tải được template')
    }
  }

  const handleImportIngredients = async (e: FormEvent) => {
    e.preventDefault()
    if (!ingredientExcelFile) {
      setIngredientImportError('Vui lòng chọn file Excel.')
      return
    }

    setIngredientImportLoading(true)
    setIngredientImportError(null)
    setIngredientImportResult(null)

    try {
      const formData = new FormData()
      formData.append('file', ingredientExcelFile)

      ingredientImageFiles.forEach((file) => {
        formData.append('images', file)
      })

      const res = await fetch(`${API_BASE}/api/ingredients/excel/import`, {
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

      const data: IngredientImportResponse = await res.json()
      setIngredientImportResult(data)
      // Sau khi import thành công, reload danh sách hiện tại
      fetchIngredients(ingredientPage)
    } catch (err: any) {
      console.error(err)
      setIngredientImportError(err.message ?? 'Import thất bại')
    } finally {
      setIngredientImportLoading(false)
    }
  }

  const fetchRecipes = async (pageNumber: number) => {
    setLoadingRecipes(true)
    setRecipeError(null)

    try {
      const params = new URLSearchParams({
        page: String(pageNumber),
        size: String(recipePageSize),
      })

      if (recipeName.trim()) {
        params.append('name', recipeName.trim())
      }

      const res = await fetch(`${API_BASE}/api/recipes?${params.toString()}`, {
        headers: isLoggedIn
          ? {
              Authorization: `Bearer ${user?.token}`,
            }
          : undefined,
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Lấy món ăn lỗi ${res.status}`)
      }

      const data: RecipePage = await res.json()
      setRecipesPage(data)
    } catch (err: any) {
      console.error(err)
      setRecipeError(err.message ?? 'Không lấy được danh sách món ăn')
    } finally {
      setLoadingRecipes(false)
    }
  }

  const fetchAvailableIngredients = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/ingredients?page=0&size=1000`, {
        headers: isLoggedIn
          ? {
              Authorization: `Bearer ${user?.token}`,
            }
          : undefined,
      })
      if (!res.ok) return
      const data: IngredientPage = await res.json()
      setAvailableIngredients(data.content)
    } catch (err) {
      console.error(err)
    }
  }

  const handleCreateRecipe = async (e: FormEvent) => {
    e.preventDefault()
    if (!createRecipeName.trim()) {
      setCreateRecipeError('Tên món ăn là bắt buộc')
      return
    }

    try {
      setCreateRecipeLoading(true)
      setCreateRecipeError(null)

      const formData = new FormData()
      formData.append('name', createRecipeName.trim())
      if (createRecipeDescription.trim()) {
        formData.append('description', createRecipeDescription.trim())
      }
      if (createRecipeCalories.trim()) {
        const calories = Number(createRecipeCalories)
        if (!Number.isNaN(calories) && calories >= 0) {
          formData.append('calories', String(calories))
        }
      }
      if (createRecipeProtein.trim()) {
        const protein = Number(createRecipeProtein)
        if (!Number.isNaN(protein) && protein >= 0) {
          formData.append('protein', String(protein))
        }
      }
      if (createRecipeCarbs.trim()) {
        const carbs = Number(createRecipeCarbs)
        if (!Number.isNaN(carbs) && carbs >= 0) {
          formData.append('carbs', String(carbs))
        }
      }
      if (createRecipeFat.trim()) {
        const fat = Number(createRecipeFat)
        if (!Number.isNaN(fat) && fat >= 0) {
          formData.append('fat', String(fat))
        }
      }
      if (createRecipeType.trim()) {
        formData.append('type', createRecipeType.trim())
      }

      createRecipeIngredients.forEach((ri, index) => {
        if (ri.ingredientId && ri.quantity.trim()) {
          formData.append(`recipeIngredients[${index}].ingredient.id`, String(ri.ingredientId))
          formData.append(`recipeIngredients[${index}].quantity`, ri.quantity.trim())
        }
      })

      if (createRecipeImageFile) {
        formData.append('image', createRecipeImageFile)
      }

      const res = await fetch(`${API_BASE}/api/recipes`, {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Tạo món ăn thất bại (${res.status})`)
      }

      const created: Recipe = await res.json()
      setRecipesPage((prev) =>
        prev
          ? {
              ...prev,
              content: [created, ...prev.content],
              page: {
                ...prev.page,
                totalElements: prev.page.totalElements + 1,
              },
            }
          : prev,
      )

      // Reset form
      setCreateRecipeName('')
      setCreateRecipeDescription('')
      setCreateRecipeCalories('')
      setCreateRecipeProtein('')
      setCreateRecipeCarbs('')
      setCreateRecipeFat('')
      setCreateRecipeType('')
      setCreateRecipeIngredients([])
      setCreateRecipeImageFile(null)
      setCreatingRecipe(false)
    } catch (err: any) {
      console.error(err)
      setCreateRecipeError(err.message ?? 'Tạo món ăn thất bại')
    } finally {
      setCreateRecipeLoading(false)
    }
  }

  const openEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe)
    setEditRecipeName(recipe.name)
    setEditRecipeDescription(recipe.description || '')
    setEditRecipeCalories(String(recipe.calories ?? ''))
    setEditRecipeProtein(String(recipe.protein ?? ''))
    setEditRecipeCarbs(String(recipe.carbs ?? ''))
    setEditRecipeFat(String(recipe.fat ?? ''))
    setEditRecipeType(recipe.type || '')
    setEditRecipeIngredients(
      recipe.recipeIngredients?.map((ri) => ({
        ingredientId: ri.ingredient.id,
        quantity: String(ri.quantity),
      })) || [],
    )
    setEditRecipeImageFile(null)
    setEditRecipeError(null)
  }

  const closeEditRecipe = () => {
    setEditingRecipe(null)
    setEditRecipeImageFile(null)
    setEditRecipeError(null)
  }

  const handleUpdateRecipe = async (e: FormEvent) => {
    e.preventDefault()
    if (!editingRecipe) return

    try {
      setEditRecipeLoading(true)
      setEditRecipeError(null)

      const formData = new FormData()
      formData.append('name', editRecipeName.trim())
      if (editRecipeDescription.trim()) {
        formData.append('description', editRecipeDescription.trim())
      }
      if (editRecipeCalories.trim()) {
        const calories = Number(editRecipeCalories)
        if (!Number.isNaN(calories) && calories >= 0) {
          formData.append('calories', String(calories))
        }
      }
      if (editRecipeProtein.trim()) {
        const protein = Number(editRecipeProtein)
        if (!Number.isNaN(protein) && protein >= 0) {
          formData.append('protein', String(protein))
        }
      }
      if (editRecipeCarbs.trim()) {
        const carbs = Number(editRecipeCarbs)
        if (!Number.isNaN(carbs) && carbs >= 0) {
          formData.append('carbs', String(carbs))
        }
      }
      if (editRecipeFat.trim()) {
        const fat = Number(editRecipeFat)
        if (!Number.isNaN(fat) && fat >= 0) {
          formData.append('fat', String(fat))
        }
      }
      if (editRecipeType.trim()) {
        formData.append('type', editRecipeType.trim())
      }

      editRecipeIngredients.forEach((ri, index) => {
        if (ri.ingredientId && ri.quantity.trim()) {
          formData.append(`recipeIngredients[${index}].ingredient.id`, String(ri.ingredientId))
          formData.append(`recipeIngredients[${index}].quantity`, ri.quantity.trim())
        }
      })

      if (editRecipeImageFile) {
        formData.append('image', editRecipeImageFile)
      }

      const res = await fetch(`${API_BASE}/api/recipes/${editingRecipe.id}`, {
        method: 'PUT',
        body: formData,
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Cập nhật món ăn thất bại (${res.status})`)
      }

      const updated: Recipe = await res.json()

      setRecipesPage((prev) =>
        prev
          ? {
              ...prev,
              content: prev.content.map((r) => (r.id === updated.id ? updated : r)),
            }
          : prev,
      )

      closeEditRecipe()
    } catch (err: any) {
      console.error(err)
      setEditRecipeError(err.message ?? 'Cập nhật món ăn thất bại')
    } finally {
      setEditRecipeLoading(false)
    }
  }

  const handleDeleteRecipe = async (id: number) => {
    if (
      !window.confirm(
        'Bạn có chắc chắn muốn xóa món ăn này? Hành động này không thể hoàn tác.',
      )
    ) {
      return
    }

    try {
      setDeleteRecipeLoadingId(id)
      const res = await fetch(`${API_BASE}/api/recipes/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Xóa món ăn thất bại (${res.status})`)
      }

      setRecipesPage((prev) =>
        prev
          ? {
              ...prev,
              content: prev.content.filter((r) => r.id !== id),
              page: {
                ...prev.page,
                totalElements: prev.page.totalElements - 1,
              },
            }
          : prev,
      )
    } catch (err: any) {
      console.error(err)
      alert(err.message ?? 'Xóa món ăn thất bại')
    } finally {
      setDeleteRecipeLoadingId(null)
    }
  }

  const addRecipeIngredient = (
    ingredients: { ingredientId: number; quantity: string }[],
    setIngredients: (ingredients: { ingredientId: number; quantity: string }[]) => void,
  ) => {
    setIngredients([...ingredients, { ingredientId: 0, quantity: '' }])
  }

  const removeRecipeIngredient = (
    index: number,
    ingredients: { ingredientId: number; quantity: string }[],
    setIngredients: (ingredients: { ingredientId: number; quantity: string }[]) => void,
  ) => {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  const fetchPlans = async (goalId?: number | null) => {
    const targetGoalId = goalId !== undefined ? goalId : selectedGoalId
    if (!targetGoalId) {
      setPlans([])
      return
    }

    setLoadingPlans(true)
    setPlanError(null)

    try {
      const params = new URLSearchParams({
        goalId: String(targetGoalId),
      })

      const res = await fetch(`${API_BASE}/api/plans?${params.toString()}`, {
        headers: isLoggedIn
          ? {
              Authorization: `Bearer ${user?.token}`,
            }
          : undefined,
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Lấy danh sách kế hoạch lỗi ${res.status}`)
      }

      const data: Plan[] = await res.json()
      setPlans(data)
    } catch (err: any) {
      console.error(err)
      setPlanError(err.message ?? 'Không lấy được danh sách kế hoạch')
    } finally {
      setLoadingPlans(false)
    }
  }

  const fetchPlanSessions = async (planId: number) => {
    setLoadingPlanSessions(true)
    try {
      const res = await fetch(`${API_BASE}/api/plans/${planId}/sessions`, {
        headers: isLoggedIn
          ? {
              Authorization: `Bearer ${user?.token}`,
            }
          : undefined,
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Lấy sessions lỗi ${res.status}`)
      }

      const data: PlanSession[] = await res.json()
      setPlanSessions(data)
    } catch (err: any) {
      console.error(err)
      alert(err.message ?? 'Không lấy được sessions')
    } finally {
      setLoadingPlanSessions(false)
    }
  }

  const fetchAvailableGoals = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/goals`, {
        headers: isLoggedIn
          ? {
              Authorization: `Bearer ${user?.token}`,
            }
          : undefined,
      })
      if (!res.ok) return
      const data: { id: number; name: string }[] = await res.json()
      setAvailableGoals(data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleCreatePlan = async (e: FormEvent) => {
    e.preventDefault()
    if (!createPlanName.trim()) {
      setCreatePlanError('Tên kế hoạch là bắt buộc')
      return
    }

    try {
      setCreatePlanLoading(true)
      setCreatePlanError(null)

      const body: any = {
        name: createPlanName.trim(),
      }

      if (createPlanGoalId) {
        body.goal = { id: createPlanGoalId }
      }

      const res = await fetch(`${API_BASE}/api/plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Tạo kế hoạch thất bại (${res.status})`)
      }

      const created: Plan = await res.json()
      setPlans((prev) => [created, ...prev])

      // Reset form
      setCreatePlanName('')
      setCreatePlanGoalId(null)
      setCreatingPlan(false)
    } catch (err: any) {
      console.error(err)
      setCreatePlanError(err.message ?? 'Tạo kế hoạch thất bại')
    } finally {
      setCreatePlanLoading(false)
    }
  }

  const openEditPlan = async (plan: Plan) => {
    setEditingPlan(plan)
    setEditPlanName(plan.name)
    setEditPlanGoalId(plan.goal?.id || null)
    setEditPlanError(null)

    // Fetch sessions for this plan
    try {
      const res = await fetch(`${API_BASE}/api/plans/${plan.id}/sessions`, {
        headers: isLoggedIn
          ? {
              Authorization: `Bearer ${user?.token}`,
            }
          : undefined,
      })

      if (res.ok) {
        const sessions: PlanSession[] = await res.json()
        setEditPlanSessions(
          sessions.map((s) => ({
            id: s.id,
            sessionDayOfWeek: s.sessionDayOfWeek,
            targetCalories: String(s.targetCalories),
            category: s.category,
            muscleGroupIds: s.muscleGroups?.map((mg) => mg.id) || [],
          })),
        )
      } else {
        setEditPlanSessions([])
      }
    } catch (err) {
      console.error(err)
      setEditPlanSessions([])
    }
  }

  const closeEditPlan = () => {
    setEditingPlan(null)
    setEditPlanError(null)
    setEditPlanSessions([])
  }

  const handleUpdatePlan = async (e: FormEvent) => {
    e.preventDefault()
    if (!editingPlan) return

    try {
      setEditPlanLoading(true)
      setEditPlanError(null)

      const body: any = {
        name: editPlanName.trim(),
      }

      if (editPlanGoalId) {
        body.goal = { id: editPlanGoalId }
      }

      // Add plan sessions
      body.planSessions = editPlanSessions.map((s) => {
        const session: any = {
          sessionDayOfWeek: s.sessionDayOfWeek,
          targetCalories: Number(s.targetCalories),
          category: s.category,
        }
        if (s.id) {
          session.id = s.id
        }
        if (s.muscleGroupIds.length > 0) {
          session.muscleGroups = s.muscleGroupIds.map((id) => ({ id }))
        }
        return session
      })

      const res = await fetch(`${API_BASE}/api/plans/${editingPlan.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Cập nhật kế hoạch thất bại (${res.status})`)
      }

      const updated: Plan = await res.json()
      setPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))

      closeEditPlan()
    } catch (err: any) {
      console.error(err)
      setEditPlanError(err.message ?? 'Cập nhật kế hoạch thất bại')
    } finally {
      setEditPlanLoading(false)
    }
  }

  const addPlanSession = () => {
    setEditPlanSessions([
      ...editPlanSessions,
      {
        sessionDayOfWeek: 'MONDAY',
        targetCalories: '',
        category: 'STRENGTH',
        muscleGroupIds: [],
      },
    ])
  }

  const removePlanSession = (index: number) => {
    setEditPlanSessions(editPlanSessions.filter((_, i) => i !== index))
  }

  const handleDeletePlan = async (id: number) => {
    if (
      !window.confirm(
        'Bạn có chắc chắn muốn xóa kế hoạch này? Hành động này không thể hoàn tác.',
      )
    ) {
      return
    }

    try {
      setDeletePlanLoadingId(id)
      const res = await fetch(`${API_BASE}/api/plans/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Xóa kế hoạch thất bại (${res.status})`)
      }

      setPlans((prev) => prev.filter((p) => p.id !== id))
      if (selectedPlan?.id === id) {
        setSelectedPlan(null)
        setPlanSessions([])
      }
    } catch (err: any) {
      console.error(err)
      alert(err.message ?? 'Xóa kế hoạch thất bại')
    } finally {
      setDeletePlanLoadingId(null)
    }
  }

  const handleViewPlanSessions = async (plan: Plan) => {
    setSelectedPlan(plan)
    await fetchPlanSessions(plan.id)
  }

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
    setIngredientsPage(null)
    setIngredientPage(0)
    setIngredientName('')
    setEditingIngredient(null)
    setCreatingIngredient(false)
    setIngredientExcelFile(null)
    setIngredientImageFiles([])
    setIngredientImportResult(null)
    setIngredientImportError(null)
    setRecipesPage(null)
    setRecipePage(0)
    setRecipeName('')
    setEditingRecipe(null)
    setCreatingRecipe(false)
    setAvailableIngredients([])
    setPlans([])
    setSelectedPlan(null)
    setPlanSessions([])
    setEditingPlan(null)
    setCreatingPlan(false)
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
              <button
                type="button"
                className={`tab ${activeTab === 'foods' ? 'active' : ''}`}
                onClick={() => setActiveTab('foods')}
              >
                Quản lí món ăn
              </button>
              <button
                type="button"
                className={`tab ${activeTab === 'plans' ? 'active' : ''}`}
                onClick={() => setActiveTab('plans')}
              >
                Quản lý kế hoạch
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
                            onChange={(e) => setExerciseName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                setPage(0)
                                fetchExercises(0)
                              }
                            }}
                          />
                          <button
                            className="btn primary"
                            type="button"
                            onClick={() => {
                              setPage(0)
                              fetchExercises(0)
                            }}
                            disabled={loadingExercises}
                            title="Tìm kiếm"
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 16 16"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M7.333 12.667A5.333 5.333 0 1 0 7.333 2a5.333 5.333 0 0 0 0 10.667ZM14 14l-2.9-2.9"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="filters">
                      <div className="filter-group">
                        <h3>Loại hình</h3>
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
                              <span>{translateCategory(cat)}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="filter-group">
                        <h3>Nhóm cơ</h3>
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
                        <h3>Độ khó</h3>
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
                              <span>{translateActivityLevel(lv)}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {exerciseError && <p className="error-text">{exerciseError}</p>}

                    {!exercisesPage && !loadingExercises && (
                      <p>Chưa có dữ liệu, điều chỉnh filter để lấy danh sách.</p>
                    )}

                    {exercisesPage && (
                      <>
                        <div className="table-wrapper">
                          <table className="table">
                            <thead>
                              <tr>
                                <th>ID</th>
                                <th>Tên</th>
                                <th>Loại hình</th>
                                <th>Nhóm cơ</th>
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
                                  <td>{translateCategory(ex.category)}</td>
                                  <td>{ex.muscleGroups.map((m) => m.name).join(', ')}</td>
                                  <td>{translateActivityLevel(ex.difficulty)}</td>
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
                                        title="Sửa"
                                      >
                                        <svg
                                          width="16"
                                          height="16"
                                          viewBox="0 0 16 16"
                                          fill="none"
                                          xmlns="http://www.w3.org/2000/svg"
                                        >
                                          <path
                                            d="M11.333 2a2.667 2.667 0 0 1 3.774 3.774l-8 8A2.667 2.667 0 0 1 4.667 14H2v-2.667a2.667 2.667 0 0 1 .78-1.887l8-8Z"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          />
                                          <path
                                            d="M9.333 4 12 6.667"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          />
                                        </svg>
                                      </button>
                                      <button
                                        type="button"
                                        className="btn small danger"
                                        onClick={() => handleDeleteExercise(ex.id)}
                                        disabled={deleteLoadingId === ex.id}
                                        title="Xóa"
                                      >
                                        {deleteLoadingId === ex.id ? (
                                          'Đang xóa...'
                                        ) : (
                                          <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 16 16"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                          >
                                            <path
                                              d="M2 4h12M12.667 4v9.333a1.333 1.333 0 0 1-1.334 1.334H4.667a1.333 1.333 0 0 1-1.334-1.334V4m2 0V2.667a1.333 1.333 0 0 1 1.334-1.334h2.666a1.333 1.333 0 0 1 1.334 1.334V4"
                                              stroke="currentColor"
                                              strokeWidth="1.5"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                            />
                                            <path
                                              d="M6.667 7.333v4M9.333 7.333v4"
                                              stroke="currentColor"
                                              strokeWidth="1.5"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                            />
                                          </svg>
                                        )}
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
                          <label>Loại hình</label>
                          <select
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                          >
                            <option value="">-- Chọn --</option>
                            <option value="STRENGTH">Kháng lực</option>
                            <option value="CARDIO">Cardio</option>
                            <option value="FLEXIBILITY">Linh hoạt</option>
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
                            <option value="beginner">Cơ bản</option>
                            <option value="intermediate">Trung bình</option>
                            <option value="advanced">Nâng cao</option>
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
                        <label>Nhóm cơ</label>
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

            {activeTab === 'foods' && (
              <>
                <div className="subtabs">
                  <button
                    type="button"
                    className={`subtab ${foodSubTab === 'ingredients' ? 'active' : ''}`}
                    onClick={() => setFoodSubTab('ingredients')}
                  >
                    Quản lí nguyên liệu
                  </button>
                  <button
                    type="button"
                    className={`subtab ${foodSubTab === 'recipes' ? 'active' : ''}`}
                    onClick={() => setFoodSubTab('recipes')}
                  >
                    Quản lí món ăn
                  </button>
                </div>

                {foodSubTab === 'ingredients' && !editingIngredient && !creatingIngredient && (
                  <section className="card">
                    <div className="card-header">
                      <h2>Danh sách nguyên liệu</h2>
                      <div className="card-header-actions">
                        <div className="search-input">
                          <input
                            type="text"
                            placeholder="Tìm theo tên nguyên liệu..."
                            value={ingredientName}
                            onChange={(e) => setIngredientName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                setIngredientPage(0)
                                fetchIngredients(0)
                              }
                            }}
                          />
                          <button
                            className="btn primary"
                            type="button"
                            onClick={() => {
                              setIngredientPage(0)
                              fetchIngredients(0)
                            }}
                            disabled={loadingIngredients}
                            title="Tìm kiếm"
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 16 16"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M7.333 12.667A5.333 5.333 0 1 0 7.333 2a5.333 5.333 0 0 0 0 10.667ZM14 14l-2.9-2.9"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        </div>
                        <button
                          className="btn primary"
                          type="button"
                          onClick={() => setCreatingIngredient(true)}
                        >
                          + Tạo mới
                        </button>
                      </div>
                    </div>

                    {ingredientError && <p className="error-text">{ingredientError}</p>}

                    {!ingredientsPage && !loadingIngredients && (
                      <p>Chưa có dữ liệu, điều chỉnh filter để lấy danh sách.</p>
                    )}

                    {ingredientsPage && (
                      <>
                        <div className="table-wrapper">
                          <table className="table">
                            <thead>
                              <tr>
                                <th>ID</th>
                                <th>Tên</th>
                                <th>Mô tả</th>
                                <th>Calories</th>
                                <th>Protein (g)</th>
                                <th>Carbs (g)</th>
                                <th>Fat (g)</th>
                                <th>Ảnh</th>
                                <th>Hành động</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ingredientsPage.content.map((ing) => (
                                <tr key={ing.id}>
                                  <td>{ing.id}</td>
                                  <td>{ing.name}</td>
                                  <td>{ing.description || '-'}</td>
                                  <td>{ing.calories ?? '-'}</td>
                                  <td>{ing.protein ?? '-'}</td>
                                  <td>{ing.carbs ?? '-'}</td>
                                  <td>{ing.fat ?? '-'}</td>
                                  <td>
                                    {ing.imageUrl && (
                                      <img
                                        src={ing.imageUrl}
                                        alt={ing.name}
                                        className="exercise-image"
                                      />
                                    )}
                                  </td>
                                  <td>
                                    <div className="table-actions">
                                      <button
                                        type="button"
                                        className="btn small"
                                        onClick={() => openEditIngredient(ing)}
                                        title="Sửa"
                                      >
                                        <svg
                                          width="16"
                                          height="16"
                                          viewBox="0 0 16 16"
                                          fill="none"
                                          xmlns="http://www.w3.org/2000/svg"
                                        >
                                          <path
                                            d="M11.333 2a2.667 2.667 0 0 1 3.774 3.774l-8 8A2.667 2.667 0 0 1 4.667 14H2v-2.667a2.667 2.667 0 0 1 .78-1.887l8-8Z"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          />
                                          <path
                                            d="M9.333 4 12 6.667"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          />
                                        </svg>
                                      </button>
                                      <button
                                        type="button"
                                        className="btn small danger"
                                        onClick={() => handleDeleteIngredient(ing.id)}
                                        disabled={deleteIngredientLoadingId === ing.id}
                                        title="Xóa"
                                      >
                                        {deleteIngredientLoadingId === ing.id ? (
                                          'Đang xóa...'
                                        ) : (
                                          <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 16 16"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                          >
                                            <path
                                              d="M2 4h12M12.667 4v9.333a1.333 1.333 0 0 1-1.334 1.334H4.667a1.333 1.333 0 0 1-1.334-1.334V4m2 0V2.667a1.333 1.333 0 0 1 1.334-1.334h2.666a1.333 1.333 0 0 1 1.334 1.334V4"
                                              stroke="currentColor"
                                              strokeWidth="1.5"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                            />
                                            <path
                                              d="M6.667 7.333v4M9.333 7.333v4"
                                              stroke="currentColor"
                                              strokeWidth="1.5"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                            />
                                          </svg>
                                        )}
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
                            disabled={ingredientPage <= 0 || loadingIngredients}
                            onClick={() =>
                              setIngredientPage((p) => Math.max(0, p - 1))
                            }
                          >
                            Trang trước
                          </button>
                          <span>
                            Trang {ingredientsPage.page.number + 1} /{' '}
                            {ingredientsPage.page.totalPages}
                          </span>
                          <button
                            className="btn"
                            disabled={
                              ingredientPage >= ingredientsPage.page.totalPages - 1 ||
                              loadingIngredients
                            }
                            onClick={() =>
                              setIngredientPage((p) =>
                                Math.min(
                                  ingredientsPage.page.totalPages - 1,
                                  p + 1,
                                ),
                              )
                            }
                          >
                            Trang sau
                          </button>
                          <select
                            value={ingredientPageSize}
                            onChange={(e) => {
                              const newSize = Number(e.target.value) || 10
                              setIngredientPage(0)
                              setIngredientPageSize(newSize)
                              fetchIngredients(0)
                            }}
                          >
                            {[5, 10, 20, 50].map((size) => (
                              <option key={size} value={size}>
                                {size} items / trang
                              </option>
                            ))}
                          </select>
                          <select
                            value={ingredientSort}
                            onChange={(e) => {
                              setIngredientPage(0)
                              setIngredientSort(e.target.value)
                              fetchIngredients(0)
                            }}
                          >
                            <option value="name,asc">Tên A-Z</option>
                            <option value="name,desc">Tên Z-A</option>
                            <option value="calories,asc">Calories tăng dần</option>
                            <option value="calories,desc">Calories giảm dần</option>
                          </select>
                        </div>
                      </>
                    )}
                  </section>
                )}

                {foodSubTab === 'ingredients' && creatingIngredient && (
                  <section className="card edit-card">
                    <div className="card-header">
                      <h2>Tạo nguyên liệu mới</h2>
                      <button
                        type="button"
                        className="btn secondary"
                        onClick={() => {
                          setCreatingIngredient(false)
                          setCreateIngredientError(null)
                        }}
                      >
                        Quay lại
                      </button>
                    </div>
                    <form className="form" onSubmit={handleCreateIngredient}>
                      <div className="form-row">
                        <div className="form-group">
                          <label>
                            Tên nguyên liệu <span style={{ color: 'red' }}>*</span>
                          </label>
                          <input
                            type="text"
                            value={createIngredientName}
                            onChange={(e) => setCreateIngredientName(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Mô tả</label>
                        <textarea
                          rows={3}
                          value={createIngredientDescription}
                          onChange={(e) =>
                            setCreateIngredientDescription(e.target.value)
                          }
                        />
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Calories ({'>='}0)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={createIngredientCalories}
                            onChange={(e) => setCreateIngredientCalories(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Protein (g) ({'>='}0)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={createIngredientProtein}
                            onChange={(e) => setCreateIngredientProtein(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Carbs (g) ({'>='}0)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={createIngredientCarbs}
                            onChange={(e) => setCreateIngredientCarbs(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Fat (g) ({'>='}0)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={createIngredientFat}
                            onChange={(e) => setCreateIngredientFat(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Ảnh (tuỳ chọn)</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0] ?? null
                            setCreateIngredientImageFile(file)
                          }}
                        />
                      </div>

                      {createIngredientError && (
                        <p className="error-text">{createIngredientError}</p>
                      )}

                      <div className="edit-actions">
                        <button
                          type="button"
                          className="btn secondary"
                          onClick={() => {
                            setCreatingIngredient(false)
                            setCreateIngredientError(null)
                          }}
                          disabled={createIngredientLoading}
                        >
                          Hủy
                        </button>
                        <button
                          type="submit"
                          className="btn primary"
                          disabled={createIngredientLoading}
                        >
                          {createIngredientLoading ? 'Đang tạo...' : 'Tạo nguyên liệu'}
                        </button>
                      </div>
                    </form>
                  </section>
                )}

                {foodSubTab === 'ingredients' && editingIngredient && (
                  <section className="card edit-card">
                    <div className="card-header">
                      <h2>Chỉnh sửa nguyên liệu #{editingIngredient.id}</h2>
                      <button
                        type="button"
                        className="btn secondary"
                        onClick={() => {
                          setEditingIngredient(null)
                          setEditIngredientError(null)
                        }}
                      >
                        Quay lại
                      </button>
                    </div>
                    <form className="form" onSubmit={handleUpdateIngredient}>
                      <div className="form-row">
                        <div className="form-group">
                          <label>
                            Tên nguyên liệu <span style={{ color: 'red' }}>*</span>
                          </label>
                          <input
                            type="text"
                            value={editIngredientName}
                            onChange={(e) => setEditIngredientName(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Mô tả</label>
                        <textarea
                          rows={3}
                          value={editIngredientDescription}
                          onChange={(e) =>
                            setEditIngredientDescription(e.target.value)
                          }
                        />
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Calories ({'>='}0)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editIngredientCalories}
                            onChange={(e) => setEditIngredientCalories(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Protein (g) ({'>='}0)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editIngredientProtein}
                            onChange={(e) => setEditIngredientProtein(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Carbs (g) ({'>='}0)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editIngredientCarbs}
                            onChange={(e) => setEditIngredientCarbs(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Fat (g) ({'>='}0)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editIngredientFat}
                            onChange={(e) => setEditIngredientFat(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Ảnh mới (tuỳ chọn)</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0] ?? null
                            setEditIngredientImageFile(file)
                          }}
                        />
                        {editingIngredient.imageUrl && !editIngredientImageFile && (
                          <p className="helper-text">
                            Ảnh hiện tại:
                            <br />
                            <img
                              src={editingIngredient.imageUrl}
                              alt={editingIngredient.name}
                              className="exercise-image"
                            />
                          </p>
                        )}
                      </div>

                      {editIngredientError && (
                        <p className="error-text">{editIngredientError}</p>
                      )}

                      <div className="edit-actions">
                        <button
                          type="button"
                          className="btn secondary"
                          onClick={closeEditIngredient}
                          disabled={editIngredientLoading}
                        >
                          Hủy
                        </button>
                        <button
                          type="submit"
                          className="btn primary"
                          disabled={editIngredientLoading}
                        >
                          {editIngredientLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                      </div>
                    </form>
                  </section>
                )}

                {foodSubTab === 'ingredients' && !editingIngredient && !creatingIngredient && (
                  <section className="card" style={{ marginTop: '1rem' }}>
                    <div className="card-header">
                      <h2>Import nguyên liệu từ Excel</h2>
                      <button
                        type="button"
                        className="btn outline"
                        onClick={handleDownloadIngredientTemplate}
                      >
                        Tải template
                      </button>
                    </div>

                    <p className="helper-text">
                      File Excel cần có các cột:{' '}
                      <code>
                        Name, Description, Calories, Protein (g), Carbs (g), Fat (g),
                        Image File Name
                      </code>
                      . Cột <code>Image File Name</code> phải trùng với tên file ảnh bạn
                      upload bên dưới. Name là trường bắt buộc.
                    </p>

                    <form className="form" onSubmit={handleImportIngredients}>
                      <div className="form-group">
                        <label>File Excel</label>
                        <input
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={(e) => {
                            const file = e.target.files?.[0] ?? null
                            setIngredientExcelFile(file)
                          }}
                        />
                      </div>

                      <div className="form-group">
                        <label>Ảnh nguyên liệu (nhiều file)</label>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            const files = Array.from(e.target.files ?? [])
                            setIngredientImageFiles(files)
                          }}
                        />
                        {ingredientImageFiles.length > 0 && (
                          <p className="helper-text">
                            Đã chọn {ingredientImageFiles.length} ảnh. Đảm bảo tên file
                            trùng với cột <code>Image File Name</code> trong Excel.
                          </p>
                        )}
                      </div>

                      {ingredientImportError && (
                        <p className="error-text">{ingredientImportError}</p>
                      )}

                      <button
                        className="btn primary"
                        type="submit"
                        disabled={ingredientImportLoading}
                      >
                        {ingredientImportLoading ? 'Đang import...' : 'Import'}
                      </button>
                    </form>

                    {ingredientImportResult && (
                      <div className="import-result">
                        {ingredientImportResult.success ? (
                          <p>
                            <strong>Thành công!</strong> Đã import{' '}
                            {ingredientImportResult.totalImported || 0} nguyên liệu
                            {ingredientImportResult.totalImages
                              ? ` với ${ingredientImportResult.totalImages} ảnh`
                              : ''}
                            .
                          </p>
                        ) : (
                          <>
                            <p>
                              <strong>Lỗi:</strong> {ingredientImportResult.message}
                            </p>
                            {ingredientImportResult.errors && (
                              <p className="error-text">{ingredientImportResult.errors}</p>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </section>
                )}

                {foodSubTab === 'recipes' && !editingRecipe && !creatingRecipe && (
                  <section className="card">
                    <div className="card-header">
                      <h2>Danh sách món ăn</h2>
                      <div className="card-header-actions">
                        <div className="search-input">
                          <input
                            type="text"
                            placeholder="Tìm theo tên món ăn..."
                            value={recipeName}
                            onChange={(e) => setRecipeName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                setRecipePage(0)
                                fetchRecipes(0)
                              }
                            }}
                          />
                          <button
                            className="btn primary"
                            type="button"
                            onClick={() => {
                              setRecipePage(0)
                              fetchRecipes(0)
                            }}
                            disabled={loadingRecipes}
                            title="Tìm kiếm"
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 16 16"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M7.333 12.667A5.333 5.333 0 1 0 7.333 2a5.333 5.333 0 0 0 0 10.667ZM14 14l-2.9-2.9"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        </div>
                        <button
                          className="btn primary"
                          type="button"
                          onClick={() => setCreatingRecipe(true)}
                        >
                          + Tạo mới
                        </button>
                      </div>
                    </div>

                    {recipeError && <p className="error-text">{recipeError}</p>}

                    {!recipesPage && !loadingRecipes && (
                      <p>Chưa có dữ liệu, điều chỉnh filter để lấy danh sách.</p>
                    )}

                    {recipesPage && (
                      <>
                        <div className="table-wrapper">
                          <table className="table">
                            <thead>
                              <tr>
                                <th>ID</th>
                                <th>Tên</th>
                                <th>Mô tả</th>
                                <th>Loại</th>
                                <th>Calories</th>
                                <th>Protein (g)</th>
                                <th>Carbs (g)</th>
                                <th>Fat (g)</th>
                                <th>Ảnh</th>
                                <th>Hành động</th>
                              </tr>
                            </thead>
                            <tbody>
                              {recipesPage.content.map((recipe) => (
                                <tr key={recipe.id}>
                                  <td>{recipe.id}</td>
                                  <td>{recipe.name}</td>
                                  <td>{recipe.description || '-'}</td>
                                  <td>{recipe.type || '-'}</td>
                                  <td>{recipe.calories ?? '-'}</td>
                                  <td>{recipe.protein ?? '-'}</td>
                                  <td>{recipe.carbs ?? '-'}</td>
                                  <td>{recipe.fat ?? '-'}</td>
                                  <td>
                                    {recipe.imageUrl && (
                                      <img
                                        src={recipe.imageUrl}
                                        alt={recipe.name}
                                        className="exercise-image"
                                      />
                                    )}
                                  </td>
                                  <td>
                                    <div className="table-actions">
                                      <button
                                        type="button"
                                        className="btn small"
                                        onClick={() => openEditRecipe(recipe)}
                                        title="Sửa"
                                      >
                                        <svg
                                          width="16"
                                          height="16"
                                          viewBox="0 0 16 16"
                                          fill="none"
                                          xmlns="http://www.w3.org/2000/svg"
                                        >
                                          <path
                                            d="M11.333 2a2.667 2.667 0 0 1 3.774 3.774l-8 8A2.667 2.667 0 0 1 4.667 14H2v-2.667a2.667 2.667 0 0 1 .78-1.887l8-8Z"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          />
                                          <path
                                            d="M9.333 4 12 6.667"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          />
                                        </svg>
                                      </button>
                                      <button
                                        type="button"
                                        className="btn small danger"
                                        onClick={() => handleDeleteRecipe(recipe.id)}
                                        disabled={deleteRecipeLoadingId === recipe.id}
                                        title="Xóa"
                                      >
                                        {deleteRecipeLoadingId === recipe.id ? (
                                          'Đang xóa...'
                                        ) : (
                                          <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 16 16"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                          >
                                            <path
                                              d="M2 4h12M12.667 4v9.333a1.333 1.333 0 0 1-1.334 1.334H4.667a1.333 1.333 0 0 1-1.334-1.334V4m2 0V2.667a1.333 1.333 0 0 1 1.334-1.334h2.666a1.333 1.333 0 0 1 1.334 1.334V4"
                                              stroke="currentColor"
                                              strokeWidth="1.5"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                            />
                                            <path
                                              d="M6.667 7.333v4M9.333 7.333v4"
                                              stroke="currentColor"
                                              strokeWidth="1.5"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                            />
                                          </svg>
                                        )}
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
                            disabled={recipePage <= 0 || loadingRecipes}
                            onClick={() => setRecipePage((p) => Math.max(0, p - 1))}
                          >
                            Trang trước
                          </button>
                          <span>
                            Trang {recipesPage.page.number + 1} /{' '}
                            {recipesPage.page.totalPages}
                          </span>
                          <button
                            className="btn"
                            disabled={
                              recipePage >= recipesPage.page.totalPages - 1 ||
                              loadingRecipes
                            }
                            onClick={() =>
                              setRecipePage((p) =>
                                Math.min(recipesPage.page.totalPages - 1, p + 1),
                              )
                            }
                          >
                            Trang sau
                          </button>
                          <select
                            value={recipePageSize}
                            onChange={(e) => {
                              const newSize = Number(e.target.value) || 10
                              setRecipePage(0)
                              setRecipePageSize(newSize)
                              fetchRecipes(0)
                            }}
                          >
                            {[5, 10, 20, 50].map((size) => (
                              <option key={size} value={size}>
                                {size} items / trang
                              </option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}
                  </section>
                )}

                {foodSubTab === 'recipes' && creatingRecipe && (
                  <section className="card edit-card">
                    <div className="card-header">
                      <h2>Tạo món ăn mới</h2>
                      <button
                        type="button"
                        className="btn secondary"
                        onClick={() => {
                          setCreatingRecipe(false)
                          setCreateRecipeError(null)
                        }}
                      >
                        Quay lại
                      </button>
                    </div>
                    <form className="form" onSubmit={handleCreateRecipe}>
                      <div className="form-row">
                        <div className="form-group">
                          <label>
                            Tên món ăn <span style={{ color: 'red' }}>*</span>
                          </label>
                          <input
                            type="text"
                            value={createRecipeName}
                            onChange={(e) => setCreateRecipeName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Loại món ăn</label>
                          <select
                            value={createRecipeType}
                            onChange={(e) => setCreateRecipeType(e.target.value)}
                          >
                            <option value="">-- Chọn --</option>
                            <option value="MAIN_DISH">Món chính</option>
                            <option value="SIDE_DISH">Món phụ</option>
                            <option value="APPETIZER">Khai vị</option>
                            <option value="DESSERT">Tráng miệng</option>
                            <option value="DRINK">Đồ uống</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Mô tả</label>
                        <textarea
                          rows={3}
                          value={createRecipeDescription}
                          onChange={(e) => setCreateRecipeDescription(e.target.value)}
                        />
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Calories ({'>='}0)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={createRecipeCalories}
                            onChange={(e) => setCreateRecipeCalories(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Protein (g) ({'>='}0)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={createRecipeProtein}
                            onChange={(e) => setCreateRecipeProtein(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Carbs (g) ({'>='}0)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={createRecipeCarbs}
                            onChange={(e) => setCreateRecipeCarbs(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Fat (g) ({'>='}0)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={createRecipeFat}
                            onChange={(e) => setCreateRecipeFat(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Nguyên liệu</label>
                        {createRecipeIngredients.map((ri, index) => (
                          <div
                            key={index}
                            style={{
                              display: 'flex',
                              gap: '0.5rem',
                              marginBottom: '0.5rem',
                              alignItems: 'flex-end',
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <select
                                value={ri.ingredientId}
                                onChange={(e) => {
                                  const newIngredients = [...createRecipeIngredients]
                                  newIngredients[index].ingredientId = Number(e.target.value)
                                  setCreateRecipeIngredients(newIngredients)
                                }}
                                style={{ width: '100%' }}
                              >
                                <option value="0">-- Chọn nguyên liệu --</option>
                                {availableIngredients.map((ing) => (
                                  <option key={ing.id} value={ing.id}>
                                    {ing.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div style={{ flex: 1 }}>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="Số lượng"
                                value={ri.quantity}
                                onChange={(e) => {
                                  const newIngredients = [...createRecipeIngredients]
                                  newIngredients[index].quantity = e.target.value
                                  setCreateRecipeIngredients(newIngredients)
                                }}
                              />
                            </div>
                            <button
                              type="button"
                              className="btn small danger"
                              onClick={() =>
                                removeRecipeIngredient(
                                  index,
                                  createRecipeIngredients,
                                  setCreateRecipeIngredients,
                                )
                              }
                            >
                              Xóa
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="btn outline"
                          onClick={() =>
                            addRecipeIngredient(
                              createRecipeIngredients,
                              setCreateRecipeIngredients,
                            )
                          }
                        >
                          + Thêm nguyên liệu
                        </button>
                      </div>

                      <div className="form-group">
                        <label>Ảnh (tuỳ chọn)</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0] ?? null
                            setCreateRecipeImageFile(file)
                          }}
                        />
                      </div>

                      {createRecipeError && (
                        <p className="error-text">{createRecipeError}</p>
                      )}

                      <div className="edit-actions">
                        <button
                          type="button"
                          className="btn secondary"
                          onClick={() => {
                            setCreatingRecipe(false)
                            setCreateRecipeError(null)
                          }}
                          disabled={createRecipeLoading}
                        >
                          Hủy
                        </button>
                        <button
                          type="submit"
                          className="btn primary"
                          disabled={createRecipeLoading}
                        >
                          {createRecipeLoading ? 'Đang tạo...' : 'Tạo món ăn'}
                        </button>
                      </div>
                    </form>
                  </section>
                )}

                {foodSubTab === 'recipes' && editingRecipe && (
                  <section className="card edit-card">
                    <div className="card-header">
                      <h2>Chỉnh sửa món ăn #{editingRecipe.id}</h2>
                      <button
                        type="button"
                        className="btn secondary"
                        onClick={() => {
                          setEditingRecipe(null)
                          setEditRecipeError(null)
                        }}
                      >
                        Quay lại
                      </button>
                    </div>
                    <form className="form" onSubmit={handleUpdateRecipe}>
                      <div className="form-row">
                        <div className="form-group">
                          <label>
                            Tên món ăn <span style={{ color: 'red' }}>*</span>
                          </label>
                          <input
                            type="text"
                            value={editRecipeName}
                            onChange={(e) => setEditRecipeName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Loại món ăn</label>
                          <select
                            value={editRecipeType}
                            onChange={(e) => setEditRecipeType(e.target.value)}
                          >
                            <option value="">-- Chọn --</option>
                            <option value="MAIN_DISH">Món chính</option>
                            <option value="SIDE_DISH">Món phụ</option>
                            <option value="APPETIZER">Khai vị</option>
                            <option value="DESSERT">Tráng miệng</option>
                            <option value="DRINK">Đồ uống</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Mô tả</label>
                        <textarea
                          rows={3}
                          value={editRecipeDescription}
                          onChange={(e) => setEditRecipeDescription(e.target.value)}
                        />
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Calories ({'>='}0)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editRecipeCalories}
                            onChange={(e) => setEditRecipeCalories(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Protein (g) ({'>='}0)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editRecipeProtein}
                            onChange={(e) => setEditRecipeProtein(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Carbs (g) ({'>='}0)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editRecipeCarbs}
                            onChange={(e) => setEditRecipeCarbs(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Fat (g) ({'>='}0)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editRecipeFat}
                            onChange={(e) => setEditRecipeFat(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Nguyên liệu</label>
                        {editRecipeIngredients.map((ri, index) => (
                          <div
                            key={index}
                            style={{
                              display: 'flex',
                              gap: '0.5rem',
                              marginBottom: '0.5rem',
                              alignItems: 'flex-end',
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <select
                                value={ri.ingredientId}
                                onChange={(e) => {
                                  const newIngredients = [...editRecipeIngredients]
                                  newIngredients[index].ingredientId = Number(e.target.value)
                                  setEditRecipeIngredients(newIngredients)
                                }}
                                style={{ width: '100%' }}
                              >
                                <option value="0">-- Chọn nguyên liệu --</option>
                                {availableIngredients.map((ing) => (
                                  <option key={ing.id} value={ing.id}>
                                    {ing.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div style={{ flex: 1 }}>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="Số lượng"
                                value={ri.quantity}
                                onChange={(e) => {
                                  const newIngredients = [...editRecipeIngredients]
                                  newIngredients[index].quantity = e.target.value
                                  setEditRecipeIngredients(newIngredients)
                                }}
                              />
                            </div>
                            <button
                              type="button"
                              className="btn small danger"
                              onClick={() =>
                                removeRecipeIngredient(
                                  index,
                                  editRecipeIngredients,
                                  setEditRecipeIngredients,
                                )
                              }
                            >
                              Xóa
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="btn outline"
                          onClick={() =>
                            addRecipeIngredient(
                              editRecipeIngredients,
                              setEditRecipeIngredients,
                            )
                          }
                        >
                          + Thêm nguyên liệu
                        </button>
                      </div>

                      <div className="form-group">
                        <label>Ảnh mới (tuỳ chọn)</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0] ?? null
                            setEditRecipeImageFile(file)
                          }}
                        />
                        {editingRecipe.imageUrl && !editRecipeImageFile && (
                          <p className="helper-text">
                            Ảnh hiện tại:
                            <br />
                            <img
                              src={editingRecipe.imageUrl}
                              alt={editingRecipe.name}
                              className="exercise-image"
                            />
                          </p>
                        )}
                      </div>

                      {editRecipeError && (
                        <p className="error-text">{editRecipeError}</p>
                      )}

                      <div className="edit-actions">
                        <button
                          type="button"
                          className="btn secondary"
                          onClick={closeEditRecipe}
                          disabled={editRecipeLoading}
                        >
                          Hủy
                        </button>
                        <button
                          type="submit"
                          className="btn primary"
                          disabled={editRecipeLoading}
                        >
                          {editRecipeLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                      </div>
                    </form>
                  </section>
                )}
              </>
            )}

            {activeTab === 'plans' && (
              <>
                {!editingPlan && !creatingPlan && (
                  <section className="card">
                    <div className="card-header">
                      <h2>Danh sách kế hoạch</h2>
                      <div className="card-header-actions">
                        <select
                          value={selectedGoalId || ''}
                          onChange={(e) => {
                            const goalId = e.target.value
                              ? Number(e.target.value)
                              : null
                            setSelectedGoalId(goalId)
                            if (goalId !== null) {
                              fetchPlans(goalId)
                            }
                          }}
                          style={{ marginRight: '0.5rem' }}
                        >
                          <option value="">-- Chọn mục tiêu --</option>
                          {availableGoals.map((goal) => (
                            <option key={goal.id} value={goal.id}>
                              {goal.name}
                            </option>
                          ))}
                        </select>
                        <button
                          className="btn primary"
                          type="button"
                          onClick={() => setCreatingPlan(true)}
                        >
                          + Tạo mới
                        </button>
                        <button
                          className="btn outline"
                          type="button"
                          onClick={() => fetchPlans(selectedGoalId)}
                          disabled={loadingPlans || !selectedGoalId}
                        >
                          {loadingPlans ? 'Đang tải...' : 'Tải lại'}
                        </button>
                      </div>
                    </div>

                    {planError && <p className="error-text">{planError}</p>}

                    {!selectedGoalId && !loadingPlans && (
                      <p>Vui lòng chọn mục tiêu để xem danh sách kế hoạch.</p>
                    )}

                    {selectedGoalId && !plans.length && !loadingPlans && (
                      <p>
                        Chưa có kế hoạch nào cho mục tiêu này. Nhấn &quot;Tạo mới&quot; để
                        tạo kế hoạch.
                      </p>
                    )}

                    {plans.length > 0 && (
                      <div className="table-wrapper">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>Tên kế hoạch</th>
                              <th>Mục tiêu</th>
                              <th>Số sessions</th>
                              <th>Hành động</th>
                            </tr>
                          </thead>
                          <tbody>
                            {plans.map((plan) => (
                              <tr key={plan.id}>
                                <td>{plan.id}</td>
                                <td>{plan.name}</td>
                                <td>{plan.goal?.name || '-'}</td>
                                <td>{plan.planSessions?.length || 0}</td>
                                <td>
                                  <div className="table-actions">
                                    <button
                                      type="button"
                                      className="btn small"
                                      onClick={() => handleViewPlanSessions(plan)}
                                      title="Xem sessions"
                                    >
                                      <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 16 16"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <path
                                          d="M8 3C4.667 3 2.073 5.28 1 8.5c1.073 3.22 3.667 5.5 7 5.5s5.927-2.28 7-5.5C13.927 5.28 11.333 3 8 3Z"
                                          stroke="currentColor"
                                          strokeWidth="1.5"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                        <path
                                          d="M8 10.667a2.667 2.667 0 1 0 0-5.334 2.667 2.667 0 0 0 0 5.334Z"
                                          stroke="currentColor"
                                          strokeWidth="1.5"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                      </svg>
                                    </button>
                                    <button
                                      type="button"
                                      className="btn small"
                                      onClick={() => openEditPlan(plan)}
                                      title="Sửa"
                                    >
                                      <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 16 16"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <path
                                          d="M11.333 2a2.667 2.667 0 0 1 3.774 3.774l-8 8A2.667 2.667 0 0 1 4.667 14H2v-2.667a2.667 2.667 0 0 1 .78-1.887l8-8Z"
                                          stroke="currentColor"
                                          strokeWidth="1.5"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                        <path
                                          d="M9.333 4 12 6.667"
                                          stroke="currentColor"
                                          strokeWidth="1.5"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                      </svg>
                                    </button>
                                    <button
                                      type="button"
                                      className="btn small danger"
                                      onClick={() => handleDeletePlan(plan.id)}
                                      disabled={deletePlanLoadingId === plan.id}
                                      title="Xóa"
                                    >
                                      {deletePlanLoadingId === plan.id ? (
                                        'Đang xóa...'
                                      ) : (
                                        <svg
                                          width="16"
                                          height="16"
                                          viewBox="0 0 16 16"
                                          fill="none"
                                          xmlns="http://www.w3.org/2000/svg"
                                        >
                                          <path
                                            d="M2 4h12M12.667 4v9.333a1.333 1.333 0 0 1-1.334 1.334H4.667a1.333 1.333 0 0 1-1.334-1.334V4m2 0V2.667a1.333 1.333 0 0 1 1.334-1.334h2.666a1.333 1.333 0 0 1 1.334 1.334V4"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          />
                                          <path
                                            d="M6.667 7.333v4M9.333 7.333v4"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          />
                                        </svg>
                                      )}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {selectedPlan && (
                      <section className="card" style={{ marginTop: '1rem' }}>
                        <div className="card-header">
                          <h3>Sessions của kế hoạch: {selectedPlan.name}</h3>
                          <button
                            type="button"
                            className="btn secondary"
                            onClick={() => {
                              setSelectedPlan(null)
                              setPlanSessions([])
                            }}
                          >
                            Đóng
                          </button>
                        </div>
                        {loadingPlanSessions ? (
                          <p>Đang tải sessions...</p>
                        ) : planSessions.length > 0 ? (
                          <div className="table-wrapper">
                            <table className="table">
                              <thead>
                                <tr>
                                  <th>ID</th>
                                  <th>Ngày trong tuần</th>
                                  <th>Calories mục tiêu</th>
                                  <th>Loại hình</th>
                                  <th>Nhóm cơ</th>
                                </tr>
                              </thead>
                              <tbody>
                                {planSessions.map((session) => (
                                  <tr key={session.id}>
                                    <td>{session.id}</td>
                                    <td>{session.sessionDayOfWeek}</td>
                                    <td>{session.targetCalories}</td>
                                    <td>{translateCategory(session.category)}</td>
                                    <td>
                                      {session.muscleGroups
                                        ?.map((mg) => mg.name)
                                        .join(', ') || '-'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p>Chưa có sessions nào.</p>
                        )}
                      </section>
                    )}
                  </section>
                )}

                {creatingPlan && (
                  <section className="card edit-card">
                    <div className="card-header">
                      <h2>Tạo kế hoạch mới</h2>
                      <button
                        type="button"
                        className="btn secondary"
                        onClick={() => {
                          setCreatingPlan(false)
                          setCreatePlanError(null)
                        }}
                      >
                        Quay lại
                      </button>
                    </div>
                    <form className="form" onSubmit={handleCreatePlan}>
                      <div className="form-row">
                        <div className="form-group">
                          <label>
                            Tên kế hoạch <span style={{ color: 'red' }}>*</span>
                          </label>
                          <input
                            type="text"
                            value={createPlanName}
                            onChange={(e) => setCreatePlanName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Mục tiêu</label>
                          <select
                            value={createPlanGoalId || ''}
                            onChange={(e) =>
                              setCreatePlanGoalId(
                                e.target.value ? Number(e.target.value) : null,
                              )
                            }
                          >
                            <option value="">-- Chọn mục tiêu --</option>
                            {availableGoals.map((goal) => (
                              <option key={goal.id} value={goal.id}>
                                {goal.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {createPlanError && (
                        <p className="error-text">{createPlanError}</p>
                      )}

                      <div className="edit-actions">
                        <button
                          type="button"
                          className="btn secondary"
                          onClick={() => {
                            setCreatingPlan(false)
                            setCreatePlanError(null)
                          }}
                          disabled={createPlanLoading}
                        >
                          Hủy
                        </button>
                        <button
                          type="submit"
                          className="btn primary"
                          disabled={createPlanLoading}
                        >
                          {createPlanLoading ? 'Đang tạo...' : 'Tạo kế hoạch'}
                        </button>
                      </div>
                    </form>
                  </section>
                )}

                {editingPlan && (
                  <section className="card edit-card">
                    <div className="card-header">
                      <h2>Chỉnh sửa kế hoạch #{editingPlan.id}</h2>
                      <button
                        type="button"
                        className="btn secondary"
                        onClick={() => {
                          setEditingPlan(null)
                          setEditPlanError(null)
                        }}
                      >
                        Quay lại
                      </button>
                    </div>
                    <form className="form" onSubmit={handleUpdatePlan}>
                      <div className="form-row">
                        <div className="form-group">
                          <label>
                            Tên kế hoạch <span style={{ color: 'red' }}>*</span>
                          </label>
                          <input
                            type="text"
                            value={editPlanName}
                            onChange={(e) => setEditPlanName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Mục tiêu</label>
                          <select
                            value={editPlanGoalId || ''}
                            onChange={(e) =>
                              setEditPlanGoalId(
                                e.target.value ? Number(e.target.value) : null,
                              )
                            }
                          >
                            <option value="">-- Chọn mục tiêu --</option>
                            {availableGoals.map((goal) => (
                              <option key={goal.id} value={goal.id}>
                                {goal.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Sessions</label>
                        {editPlanSessions.map((session, index) => (
                          <div
                            key={index}
                            style={{
                              border: '1px solid #e5e7eb',
                              borderRadius: '0.5rem',
                              padding: '1rem',
                              marginBottom: '0.75rem',
                              background: '#f9fafb',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '0.5rem',
                              }}
                            >
                              <strong>Session {index + 1}</strong>
                              <button
                                type="button"
                                className="btn small danger"
                                onClick={() => removePlanSession(index)}
                              >
                                Xóa
                              </button>
                            </div>
                            <div className="form-row">
                              <div className="form-group">
                                <label>Ngày trong tuần</label>
                                <select
                                  value={session.sessionDayOfWeek}
                                  onChange={(e) => {
                                    const newSessions = [...editPlanSessions]
                                    newSessions[index].sessionDayOfWeek =
                                      e.target.value
                                    setEditPlanSessions(newSessions)
                                  }}
                                >
                                  <option value="MONDAY">Thứ 2</option>
                                  <option value="TUESDAY">Thứ 3</option>
                                  <option value="WEDNESDAY">Thứ 4</option>
                                  <option value="THURSDAY">Thứ 5</option>
                                  <option value="FRIDAY">Thứ 6</option>
                                  <option value="SATURDAY">Thứ 7</option>
                                  <option value="SUNDAY">Chủ nhật</option>
                                </select>
                              </div>
                              <div className="form-group">
                                <label>Calories mục tiêu</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={session.targetCalories}
                                  onChange={(e) => {
                                    const newSessions = [...editPlanSessions]
                                    newSessions[index].targetCalories =
                                      e.target.value
                                    setEditPlanSessions(newSessions)
                                  }}
                                />
                              </div>
                              <div className="form-group">
                                <label>Loại hình</label>
                                <select
                                  value={session.category}
                                  onChange={(e) => {
                                    const newSessions = [...editPlanSessions]
                                    newSessions[index].category = e.target.value
                                    setEditPlanSessions(newSessions)
                                  }}
                                >
                                  <option value="STRENGTH">Kháng lực</option>
                                  <option value="CARDIO">Cardio</option>
                                </select>
                              </div>
                            </div>
                            <div className="form-group">
                              <label>Nhóm cơ</label>
                              <div className="checkbox-group checkbox-group-scroll">
                                {muscleGroupOptions.map((mg) => (
                                  <label key={mg.id} className="checkbox-item">
                                    <input
                                      type="checkbox"
                                      checked={session.muscleGroupIds.includes(
                                        mg.id,
                                      )}
                                      onChange={(e) => {
                                        const newSessions = [...editPlanSessions]
                                        if (e.target.checked) {
                                          newSessions[index].muscleGroupIds = [
                                            ...newSessions[index].muscleGroupIds,
                                            mg.id,
                                          ]
                                        } else {
                                          newSessions[index].muscleGroupIds =
                                            newSessions[
                                              index
                                            ].muscleGroupIds.filter(
                                              (id) => id !== mg.id,
                                            )
                                        }
                                        setEditPlanSessions(newSessions)
                                      }}
                                    />
                                    <span>{mg.name}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="btn outline"
                          onClick={addPlanSession}
                        >
                          + Thêm session
                        </button>
                      </div>

                      {editPlanError && (
                        <p className="error-text">{editPlanError}</p>
                      )}

                      <div className="edit-actions">
                        <button
                          type="button"
                          className="btn secondary"
                          onClick={closeEditPlan}
                          disabled={editPlanLoading}
                        >
                          Hủy
                        </button>
                        <button
                          type="submit"
                          className="btn primary"
                          disabled={editPlanLoading}
                        >
                          {editPlanLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
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
