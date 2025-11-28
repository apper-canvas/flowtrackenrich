import { Outlet } from 'react-router-dom'
import { useAuth } from '@/layouts/Root'
import { useSelector } from 'react-redux'
import Button from '@/components/atoms/Button'
import ApperIcon from '@/components/ApperIcon'

export default function Layout() {
  const { logout } = useAuth()
  const { user } = useSelector(state => state.user)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12 relative">
          {user && (
            <div className="absolute top-0 right-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-800"
              >
                <ApperIcon name="LogOut" size={16} />
                Logout
              </Button>
            </div>
          )}
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            FlowTrack
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Transform your productivity with intelligent task flow management
          </p>
        </header>
        
        <Outlet />
      </div>
    </div>
  )
}