<%@ Control Language="c#" AutoEventWireup="True" Inherits="YAF.Pages.members" CodeBehind="members.ascx.cs" %>

<%@ Import Namespace="YAF.Types.Interfaces" %>
<%@ Import Namespace="YAF.Types.Extensions" %>
<%@ Import Namespace="ServiceStack" %>

<YAF:PageLinks runat="server" ID="PageLinks" />

<div class="row">
    <div class="col-xl-12">
        <h2>
            <YAF:LocalizedLabel runat="server" LocalizedTag="TITLE" />
        </h2>
    </div>
</div>

<div class="row mb-3">
    <div class="col-xl-12">
        <YAF:Pager runat="server" ID="Pager" OnPageChange="Pager_PageChange" />
    </div>
</div>

<div class="row">
    <div class="col">
        <div class="card mb-3">
            <div class="card-header">
                <i class="fas fa-users fa-fw text-secondary pr-1"></i>
                <YAF:LocalizedLabel ID="LocalizedLabel1" runat="server" 
                                    LocalizedTag="TITLE" />
                <div class="float-right">
                        &nbsp;
                        <YAF:ThemeButton runat="server"
                                         CssClass="dropdown-toggle"
                                         DataToggle="dropdown"
                                         Type="Secondary"
                                         Icon="filter"
                                         TextLocalizedTag="FILTER_DROPDOWN"
                                         TextLocalizedPage="ADMIN_USERS"></YAF:ThemeButton>
                        <div class="dropdown-menu">
                            <div class="px-3 py-1">
                                <div class="form-row">
                                    <div class="form-group col-md-6">
                                        <asp:Label runat="server" AssociatedControlID="Group">
                                            <YAF:LocalizedLabel ID="SearchRolesLocalizedLabel" runat="server" LocalizedTag="Search_Role" />
                                        </asp:Label>
                                        <asp:DropDownList ID="Group" runat="server" CssClass="select2-select">
                                        </asp:DropDownList>
                                    </div>
                                    <div class="form-group col-md-6">
                                        <asp:Label runat="server" AssociatedControlID="Ranks">
                                            <YAF:LocalizedLabel ID="SearchRankLocalizedLabel" runat="server" LocalizedTag="Search_Rank" />
                                        </asp:Label>
                                        <asp:DropDownList ID="Ranks" runat="server" CssClass="select2-select">
                                        </asp:DropDownList>
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group col-md-6">
                                        <asp:Label runat="server" AssociatedControlID="NumPostDDL">
                                            <YAF:LocalizedLabel ID="NumPostsLabel" runat="server" LocalizedTag="NUMPOSTS" />
                                        </asp:Label>
                                        <asp:DropDownList ID="NumPostDDL" runat="server" CssClass="select2-select">
                                        </asp:DropDownList>
                                    </div>
                                    <div class="form-group col-md-6">
                                        <asp:Label runat="server" AssociatedControlID="NumPostsTB">&nbsp;</asp:Label>
                                        <asp:TextBox ID="NumPostsTB" runat="server"
                                                     CssClass="form-control"
                                                     TextMode="Number"></asp:TextBox>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <asp:Label runat="server" AssociatedControlID="UserSearchName">
                                        <YAF:LocalizedLabel ID="SearchMemberLocalizedLabel" runat="server" LocalizedTag="Search_Member" />
                                    </asp:Label>
                                    <asp:TextBox ID="UserSearchName" runat="server" CssClass="form-control"></asp:TextBox>
                                </div>
                                <div class="form-group">
                                    <YAF:ThemeButton ID="SearchByUserName" runat="server"
                                                     OnClick="Search_Click"
                                                     TextLocalizedTag="BTNSEARCH"
                                                     Type="Primary"
                                                     Icon="search">
                                    </YAF:ThemeButton>
                                    &nbsp;
                                    <YAF:ThemeButton ID="ResetUserSearch" runat="server"
                                                     OnClick="Reset_Click"
                                                     TextLocalizedTag="CLEAR"
                                                     Type="Secondary"
                                                     Icon="trash">
                                    </YAF:ThemeButton>
                                </div>
                                
                                </div>
                            </div>
                        </div>
            </div>
            <div class="card-body">
                <YAF:AlphaSort ID="AlphaSort1" runat="server" />
                <YAF:Alert runat="server" ID="MobileInfo" Type="info" MobileOnly="True">
                    <YAF:LocalizedLabel ID="LocalizedLabel220" runat="server" LocalizedTag="TABLE_RESPONSIVE" LocalizedPage="ADMIN_COMMON" />
                    <span class="float-right"><i class="fa fa-hand-point-left fa-fw"></i></span>
                </YAF:Alert>
                <div class="table-responsive">
                    <table class="table mt-3">
                        <thead>
                            <tr>
                                <th scope="col">
                                    <YAF:LocalizedLabel ID="LocalizedLabel6" runat="server" LocalizedTag="Avatar" />
                                </th>
                                <th scope="col">
                                    <asp:Label runat="server" ID="SortUserName" />
                                    <asp:LinkButton runat="server" ID="UserName" OnClick="UserName_Click" />
                                </th>
                                <th scope="col">
                                    <asp:Label runat="server" ID="SortRank" />
                                    <asp:LinkButton runat="server" ID="Rank" OnClick="Rank_Click" />
                                </th>
                                <th scope="col">
                                    <asp:Label runat="server" ID="SortJoined" />
                                    <asp:LinkButton runat="server" ID="Joined" OnClick="Joined_Click" />
                                </th>
                                <th scope="col">
                                    <asp:Label runat="server" ID="SortPosts" />
                                    <asp:LinkButton runat="server" ID="Posts" OnClick="Posts_Click" />
                                </th>
                                <th scope="col">
                                    <asp:Label runat="server" ID="SortLastVisit" />
                                    <asp:LinkButton runat="server" ID="LastVisitLB" OnClick="LastVisitLB_Click" />
                                </th>
                            </tr>
                        </thead>
                        <asp:Repeater ID="MemberList" runat="server">
                            <ItemTemplate>
                                <tr>
                                    <td>
                                        <img src="<%# this.GetAvatarUrlFileName(this.Eval("UserID").ToType<int>(), this.Eval("Avatar").ToString(), this.Eval("AvatarImage").ToString().IsSet(), this.Eval("Email").ToString()) %>" alt="<%# this.HtmlEncode(DataBinder.Eval(Container.DataItem,"Name").ToString()) %>"
                                            title="<%# this.HtmlEncode(this.Get<YafBoardSettings>().EnableDisplayName ? this.Eval("DisplayName").ToString() : this.Eval("Name").ToString()) %>" 
                                             class="rounded img-fluid" />
                                    </td>
                                    <td>
                                        <YAF:UserLink ID="UserProfileLink" runat="server" IsGuest="False" ReplaceName='<%# this.Get<YafBoardSettings>().EnableDisplayName ? this.Eval("DisplayName").ToString() : this.Eval("Name").ToString() %>' UserID='<%# this.Eval("UserID").ToType<int>() %>'
                                            Style='<%# this.Eval("Style") %>' />
                                    </td>
                                    <td>
                                        <%# this.Eval("RankName") %>
                                    </td>
                                    <td>
                                        <%# this.Get<IDateTime>().FormatDateLong((DateTime)((System.Data.DataRowView)Container.DataItem)["Joined"]) %>
                                    </td>
                                    <td>
                                        <%# "{0:N0}".Fmt(((System.Data.DataRowView)Container.DataItem)["NumPosts"]) %>
                                    </td>
                                    <td>
                                        <%# this.Get<IDateTime>().FormatDateLong((DateTime)((System.Data.DataRowView)Container.DataItem)["LastVisit"]) %>
                                    </td>
                                </tr>
                            </ItemTemplate>
                        </asp:Repeater>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>

<YAF:Pager runat="server" LinkedPager="Pager" OnPageChange="Pager_PageChange" />
