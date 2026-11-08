import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/misc';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { ListSkeleton } from '@/components/common/Loaders';
import { FadeIn } from '@/components/common/motion';
import { getInitials } from '@/lib/utils';

const StatusBadge = ({ status }) =>
  status === 'approved' ? (
    <Badge variant="success">Approved</Badge>
  ) : (
    <Badge variant="warning">Pending approval</Badge>
  );

// One quiet line of role-specific detail
const userDetails = (user) => {
  if (user.role === 'faculty') {
    return [user.department, user.faculty_id && `ID ${user.faculty_id}`].filter(Boolean).join(' · ');
  }
  if (user.role === 'student') {
    return [user.college_name, [user.course, user.year].filter(Boolean).join(' – ')].filter(Boolean).join(' · ');
  }
  return '';
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [confirmTarget, setConfirmTarget] = useState(null); // { id, name, mode: 'reject' | 'delete' }

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, selectedRole, selectedStatus]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/users/all');
      setUsers(response.data);
      setFilteredUsers(response.data);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    if (selectedRole !== 'all') {
      filtered = filtered.filter(user => user.role === selectedRole);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(user =>
        selectedStatus === 'approved' ? user.status === 'approved' : user.status !== 'approved'
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.faculty_id && user.faculty_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.college_name && user.college_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredUsers(filtered);
  };

  const approveUser = async (userId) => {
    try {
      await axios.put(`http://localhost:5000/api/users/${userId}/approve`);
      toast.success('User approved successfully');
      fetchUsers();
    } catch {
      toast.error('Failed to approve user');
    }
  };

  // Called after confirmation in ConfirmDialog (replaces window.confirm)
  const deleteUser = async (userId) => {
    try {
      await axios.delete(`http://localhost:5000/api/users/${userId}`);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedRole('all');
    setSelectedStatus('all');
  };

  const pendingCount = users.filter(u => u.role === 'faculty' && u.status === 'pending').length;
  const activeStudents = users.filter(u => u.role === 'student' && u.status === 'approved').length;
  const studentCount = users.filter(u => u.role === 'student').length;
  const facultyCount = users.filter(u => u.role === 'faculty').length;
  const hasFilters = searchTerm || selectedRole !== 'all' || selectedStatus !== 'all';

  const showPending = () => {
    setSelectedRole('faculty');
    setSelectedStatus('pending');
  };

  const renderActions = (user) =>
    user.role === 'faculty' && user.status === 'pending' ? (
      <div className="flex gap-1.5">
        <Button size="sm" onClick={() => approveUser(user.id)}>
          Approve
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => setConfirmTarget({ id: user.id, name: user.name, mode: 'reject' })}
        >
          Reject
        </Button>
      </div>
    ) : (
      <Button
        size="sm"
        variant="ghost"
        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        onClick={() => setConfirmTarget({ id: user.id, name: user.name, mode: 'delete' })}
      >
        Delete
      </Button>
    );

  return (
    <div>
      <PageHeader
        title="People"
        description={
          loading ? (
            'Everyone with an account, and faculty sign-ups waiting for a yes.'
          ) : (
            <>
              {users.length} accounts, {activeStudents} of them active students.{' '}
              {pendingCount > 0 ? (
                <button type="button" onClick={showPending} className="text-primary underline underline-offset-4">
                  {pendingCount} faculty {pendingCount === 1 ? 'sign-up needs' : 'sign-ups need'} a look.
                </button>
              ) : (
                'No faculty sign-ups waiting.'
              )}
            </>
          )
        }
      />

      {/* Filters */}
      <FadeIn delay={0.05} className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={selectedRole} onValueChange={setSelectedRole}>
          <TabsList className="w-full sm:w-fit">
            <TabsTrigger value="all">
              Everyone <span className="meta ml-1.5">{users.length}</span>
            </TabsTrigger>
            <TabsTrigger value="student">
              Students <span className="meta ml-1.5">{studentCount}</span>
            </TabsTrigger>
            <TabsTrigger value="faculty">
              Faculty <span className="meta ml-1.5">{facultyCount}</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative sm:w-64">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" strokeWidth={1.75} />
            <Input
              id="user-search"
              type="text"
              aria-label="Search people"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Name, email, ID or college"
              className="pl-9"
            />
          </div>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger id="status-filter" aria-label="Status" className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
            </SelectContent>
          </Select>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground self-start text-sm underline underline-offset-4 sm:self-auto"
            >
              Clear
            </button>
          )}
        </div>
      </FadeIn>

      {/* People */}
      <FadeIn delay={0.1}>
        {loading ? (
          <ListSkeleton rows={6} />
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            title="No one matches"
            description={hasFilters ? 'Try a different search or clear the filters.' : 'No one has signed up yet.'}
            action={hasFilters ? <Button variant="outline" onClick={clearFilters}>Clear filters</Button> : null}
          />
        ) : (
          <>
            <p className="meta mb-2">
              Showing {filteredUsers.length} of {users.length}
            </p>

            {/* Desktop table */}
            <div className="hidden border-y md:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-0">Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="pr-0 text-right"><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="pl-0">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9">
                            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="font-medium">{user.name}</div>
                            <div className="text-muted-foreground text-sm">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="capitalize">{user.role}</div>
                        {userDetails(user) && <div className="meta mt-0.5">{userDetails(user)}</div>}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <StatusBadge status={user.status} />
                      </TableCell>
                      <TableCell className="pr-0 whitespace-nowrap">
                        <div className="flex justify-end">{renderActions(user)}</div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile list */}
            <ul className="divide-y border-y md:hidden">
              {filteredUsers.map((user) => (
                <li key={user.id} className="py-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="size-9">
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="truncate font-medium">{user.name}</div>
                        <StatusBadge status={user.status} />
                      </div>
                      <div className="text-muted-foreground truncate text-sm">{user.email}</div>
                      <p className="meta mt-1">
                        <span className="capitalize">{user.role}</span>
                        {userDetails(user) && ` · ${userDetails(user)}`}
                      </p>
                      <div className="mt-3 flex justify-end">{renderActions(user)}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </FadeIn>

      <ConfirmDialog
        open={!!confirmTarget}
        onOpenChange={(o) => !o && setConfirmTarget(null)}
        title={confirmTarget?.mode === 'reject' ? 'Reject faculty registration?' : 'Delete user?'}
        description={
          confirmTarget
            ? `Are you sure you want to ${confirmTarget.mode === 'reject' ? 'reject' : 'delete'} ${confirmTarget.name}? This will remove the account and cannot be undone.`
            : undefined
        }
        confirmLabel={confirmTarget?.mode === 'reject' ? 'Reject' : 'Delete'}
        onConfirm={() => {
          const target = confirmTarget;
          setConfirmTarget(null);
          if (target) deleteUser(target.id);
        }}
      />
    </div>
  );
};

export default UserManagement;
