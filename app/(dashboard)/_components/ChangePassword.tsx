import Button from '@/components/Button';
import { Eye, EyeOff, Shield } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { changePassword, toggle2FA } from '@/services/auth/profileService';
import { useAuth } from '@/providers/AuthProvider';

// Zod validation schema
const passwordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string()
        .min(8, 'New password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
}).refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

const ChangePassword = () => {
    const { user } = useAuth();
    const [showPasswordForCurrent, setShowPasswordForCurrent] = useState(false);
    const [showPasswordForNew, setShowPasswordForNew] = useState(false);
    const [showPasswordForConfirm, setShowPasswordForConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [is2FAEnabled, setIs2FAEnabled] = useState(user?.two_factor_enabled || false);
    const [is2FAToggling, setIs2FAToggling] = useState(false);

    const { register, handleSubmit, formState: { errors }, reset, setError } = useForm<PasswordFormData>({
        resolver: zodResolver(passwordSchema),
    });

    // Update 2FA state when user data changes
    useEffect(() => {
        if (user?.two_factor_enabled !== undefined) {
            setIs2FAEnabled(user.two_factor_enabled);
        }
    }, [user?.two_factor_enabled]);

    const handleChangePassword = async (data: PasswordFormData) => {
        try {
            setIsLoading(true);
            
            const response = await changePassword({
                current_password: data.currentPassword,
                new_password: data.newPassword,
                confirm_password: data.confirmPassword,
            });

            if (response.success) {
                toast.success(response.message || 'Password updated successfully!');
                reset();
            }
        } catch (error: any) {
            console.error('Error changing password:', error);
            
            // Handle specific error cases from backend
            if (error?.response?.status === 400) {
                const errorData = error.response.data;
                
                // Check if it's the "Current password is incorrect" error
                if (errorData?.message === "Current password is incorrect") {
                    setError('currentPassword', {
                        type: 'manual',
                        message: 'Current password is incorrect'
                    });
                    toast.error('Current password is incorrect');
                } 
                // Handle validation errors
                else if (errorData?.errors) {
                    const errors = errorData.errors;
                    
                    // Map backend errors to form fields
                    if (errors.current_password) {
                        setError('currentPassword', {
                            type: 'manual',
                            message: Array.isArray(errors.current_password) 
                                ? errors.current_password[0] 
                                : errors.current_password
                        });
                    }
                    
                    if (errors.new_password) {
                        const messages = Array.isArray(errors.new_password) 
                            ? errors.new_password.join(' ') 
                            : errors.new_password;
                        setError('newPassword', {
                            type: 'manual',
                            message: messages
                        });
                    }
                    
                    if (errors.confirm_password) {
                        setError('confirmPassword', {
                            type: 'manual',
                            message: Array.isArray(errors.confirm_password) 
                                ? errors.confirm_password[0] 
                                : errors.confirm_password
                        });
                    }
                    
                    toast.error(errorData.message || 'Validation failed');
                } else {
                    toast.error(errorData?.message || 'Failed to change password');
                }
            } else if (error?.response?.status === 401) {
                toast.error('Session expired. Please login again');
            } else {
                toast.error('Failed to change password. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    }

    const handle2FAToggle = async () => {
        try {
            setIs2FAToggling(true);
            const newState = !is2FAEnabled;
            
            const response = await toggle2FA({
                enable_2fa: newState
            });

            if (response.success) {
                setIs2FAEnabled(response.data.two_factor_enabled);
                toast.success(response.message || `Two-factor authentication ${newState ? 'enabled' : 'disabled'} successfully`);
            }
        } catch (error: any) {
            console.error('Error toggling 2FA:', error);
            
            if (error?.response?.status === 400) {
                const errorData = error.response.data;
                toast.error(errorData?.message || 'Failed to toggle two-factor authentication');
            } else if (error?.response?.status === 401) {
                toast.error('Session expired. Please login again');
            } else {
                toast.error('Failed to toggle two-factor authentication. Please try again.');
            }
        } finally {
            setIs2FAToggling(false);
        }
    };

    return (
        <div className='flex flex-col gap-5 mt-5'>
            {/* Two-Factor Authentication Section */}
            <div className='bg-blue-50 border-2 border-blue-200 rounded-xl p-5'>
                <div className='flex items-start justify-between gap-4'>
                    <div className='flex gap-3 flex-1'>
                        <div className='bg-blue-500 p-3 rounded-lg h-fit'>
                            <Shield className='text-white' size={24} />
                        </div>
                        <div className='flex-1'>
                            <h2 className='text-lg font-semibold text-gray-900 mb-1'>
                                Two-Factor Authentication
                            </h2>
                            <p className='text-sm text-gray-600 mb-3'>
                                Add an extra layer of security to your account. When enabled, you'll need to enter a verification code sent to your email each time you log in.
                            </p>
                            <div className='flex items-center gap-2'>
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                                    is2FAEnabled 
                                        ? 'bg-green-100 text-green-700' 
                                        : 'bg-gray-200 text-gray-700'
                                }`}>
                                    <span className={`w-2 h-2 rounded-full ${is2FAEnabled ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                    {is2FAEnabled ? 'Enabled' : 'Disabled'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        type='button'
                        onClick={handle2FAToggle}
                        disabled={is2FAToggling}
                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            is2FAEnabled ? 'bg-blue-600' : 'bg-gray-300'
                        } ${is2FAToggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                        <span
                            className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${
                                is2FAEnabled ? 'translate-x-7' : 'translate-x-1'
                            }`}
                        />
                    </button>
                </div>
            </div>

            {/* Change Password Section */}
            <form onSubmit={handleSubmit(handleChangePassword)} className='grid grid-cols-1 gap-5 p-4 rounded-lg border-2 border-transparent'>
                <h2 className='text-lg font-semibold text-gray-900'>Change Password</h2>
                
                {/* Current Password Field */}
                <div className='flex flex-col'>
                    <label htmlFor="currentPassword" className='text-sm font-medium text-gray-700 mb-2'>
                        Current Password
                    </label>
                    <span className='flex items-center gap-2 bg-[#F3F3F5] py-2 px-3 rounded-xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500'>
                        <input
                            type={showPasswordForCurrent ? "text" : "password"}
                            id='currentPassword'
                            placeholder='Enter current password'
                            className='border-0 flex-1 focus:outline-0 bg-transparent'
                            {...register('currentPassword')}
                        />
                        {showPasswordForCurrent ? 
                            <EyeOff onClick={() => setShowPasswordForCurrent(!showPasswordForCurrent)} size={20} className='cursor-pointer text-gray-500 hover:text-gray-700' /> : 
                            <Eye onClick={() => setShowPasswordForCurrent(!showPasswordForCurrent)} size={20} className='cursor-pointer text-gray-500 hover:text-gray-700' />
                        }
                    </span>
                    {errors.currentPassword && <p className='text-red-500 text-sm mt-1'>{errors.currentPassword.message}</p>}
                </div>

                {/* New Password Field */}
                <div className='flex flex-col'>
                    <label htmlFor="newPassword" className='text-sm font-medium text-gray-700 mb-2'>
                        New Password
                    </label>
                    <span className='flex items-center gap-2 bg-[#F3F3F5] py-2 px-3 rounded-xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500'>
                        <input
                            type={showPasswordForNew ? "text" : "password"}
                            id='newPassword'
                            placeholder='Enter new password'
                            className='border-0 flex-1 focus:outline-0 bg-transparent'
                            {...register('newPassword')}
                        />
                        {showPasswordForNew ? 
                            <EyeOff onClick={() => setShowPasswordForNew(!showPasswordForNew)} size={20} className='cursor-pointer text-gray-500 hover:text-gray-700' /> : 
                            <Eye onClick={() => setShowPasswordForNew(!showPasswordForNew)} size={20} className='cursor-pointer text-gray-500 hover:text-gray-700' />
                        }
                    </span>
                    {errors.newPassword && <p className='text-red-500 text-sm mt-1'>{errors.newPassword.message}</p>}
                    <p className='text-xs text-gray-500 mt-1'>
                        Must be at least 8 characters with uppercase, number, and special character
                    </p>
                </div>

                {/* Confirm Password Field */}
                <div className='flex flex-col'>
                    <label htmlFor="confirmPassword" className='text-sm font-medium text-gray-700 mb-2'>
                        Confirm New Password
                    </label>
                    <span className='flex items-center gap-2 bg-[#F3F3F5] py-2 px-3 rounded-xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500'>
                        <input
                            type={showPasswordForConfirm ? "text" : "password"}
                            id='confirmPassword'
                            placeholder='Confirm new password'
                            className='border-0 flex-1 focus:outline-0 bg-transparent'
                            {...register('confirmPassword')}
                        />
                        {showPasswordForConfirm ? 
                            <EyeOff onClick={() => setShowPasswordForConfirm(!showPasswordForConfirm)} size={20} className='cursor-pointer text-gray-500 hover:text-gray-700' /> : 
                            <Eye onClick={() => setShowPasswordForConfirm(!showPasswordForConfirm)} size={20} className='cursor-pointer text-gray-500 hover:text-gray-700' />
                        }
                    </span>
                    {errors.confirmPassword && <p className='text-red-500 text-sm mt-1'>{errors.confirmPassword.message}</p>}
                </div>

                <Button text={isLoading ? 'Updating...' : 'Update Password'} type='submit' isDisabled={isLoading} />
            </form>
        </div>
    );
};

export default ChangePassword;